import express from 'express';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

const populateComplaint = (query) =>
  query
    .populate('citizen', 'name email role')
    .populate('department', 'name tier slaDays governanceScore')
    .populate('statusHistory.changedBy', 'name role');

// Get complaints (role-based)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'citizen') {
      query = { $or: [{ citizen: req.user._id }, { isPublic: true }] };
    } else if (req.user.role === 'dept_admin') {
      query = { department: req.user.department };
    }
    const complaints = await populateComplaint(Complaint.find(query).sort({ createdAt: -1 }));
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single complaint
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const c = await populateComplaint(Complaint.findById(req.params.id));
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user.role === 'citizen' && c.citizen._id.toString() !== req.user._id.toString() && !c.isPublic) {
      return res.status(403).json({ error: 'Forbidden: Private complaint' });
    }
    if (req.user.role === 'dept_admin' && c.department._id.toString() !== req.user.department.toString()) {
      return res.status(403).json({ error: 'Forbidden: Different department' });
    }
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File complaint
router.post('/', authenticateToken, requireRole(['citizen']), async (req, res) => {
  try {
    const { title, description, category, location, photos } = req.body;
    if (!title || !description || !category || !location) {
      return res.status(400).json({ error: 'Title, description, category, and location are required' });
    }

    let dept = await Department.findOne({ name: { $regex: new RegExp(category, 'i') } });
    if (!dept) dept = await Department.findOne();
    if (!dept) return res.status(500).json({ error: 'No departments found. Please seed the database.' });

    const complaint = await Complaint.create({
      title, description, category, location,
      photos: photos || [],
      citizen: req.user._id,
      department: dept._id,
      statusHistory: [{ status: 'pending', changedBy: req.user._id, role: 'citizen', remark: 'Grievance filed successfully.' }],
    });

    if (dept.admin) {
      await Notification.create({ user: dept.admin, message: `New grievance: "${title}" filed under your department.`, complaintId: complaint._id });
    }

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status
router.put('/:id/status', authenticateToken, requireRole(['dept_admin', 'super_admin']), async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!status || !remark) return res.status(400).json({ error: 'Status and remark required' });

    const complaint = await Complaint.findById(req.params.id).populate('department');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const dept = complaint.department;
    const historyEntry = { status, changedBy: req.user._id, role: req.user.role, remark, timestamp: new Date() };
    complaint.statusHistory.push(historyEntry);
    complaint.status = status;

    if (dept && status === 'resolved') {
      const diffDays = (Date.now() - complaint.createdAt) / (1000 * 60 * 60 * 24);
      dept.governanceScore = Math.max(10, Math.min(100, dept.governanceScore + (diffDays <= dept.slaDays ? 5 : -3)));
      await dept.save();
    }
    if (status === 'rejected' && dept) {
      dept.governanceScore = Math.max(10, dept.governanceScore - 1);
      await dept.save();
    }

    await complaint.save();

    await Notification.create({
      user: complaint.citizen,
      message: `Your grievance "${complaint.title}" updated to "${status.toUpperCase()}". Remark: "${remark}"`,
      complaintId: complaint._id,
    });

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual escalate by citizen
router.post('/:id/escalate', authenticateToken, requireRole(['citizen']), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('department');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.citizen.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    if (complaint.tier === 'state') return res.status(400).json({ error: 'Already at highest tier' });

    const nextTier = complaint.tier === 'local' ? 'district' : 'state';
    complaint.tier = nextTier;
    complaint.status = 'escalated';
    complaint.escalatedAt = new Date();
    if (nextTier === 'state') complaint.isPublic = true;

    complaint.statusHistory.push({ status: 'escalated', changedBy: req.user._id, role: 'citizen', remark: `Manually escalated to ${nextTier.toUpperCase()} level.`, timestamp: new Date() });

    const dept = complaint.department;
    if (dept) {
      dept.governanceScore = Math.max(10, dept.governanceScore - 15);
      await dept.save();
    }
    await complaint.save();

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rate resolution
router.post('/:id/rate', authenticateToken, requireRole(['citizen']), async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5' });

    const complaint = await Complaint.findById(req.params.id).populate('department');
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.citizen.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    if (complaint.status !== 'resolved') return res.status(400).json({ error: 'Can only rate resolved complaints' });

    complaint.satisfactionRating = Number(rating);
    complaint.statusHistory.push({ status: 'resolved', changedBy: req.user._id, role: 'citizen', remark: `Citizen rated this resolution ${rating} stars.`, timestamp: new Date() });

    const dept = complaint.department;
    if (dept) {
      const scoreChange = rating >= 4 ? 3 : rating <= 2 ? -4 : 0;
      dept.governanceScore = Math.max(10, Math.min(100, dept.governanceScore + scoreChange));
      await dept.save();
    }
    await complaint.save();

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin Override
router.post('/:id/override', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!status || !remark) return res.status(400).json({ error: 'Status and remark required' });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    complaint.status = status;
    complaint.statusHistory.push({ status, changedBy: req.user._id, role: 'super_admin', remark: `Super Admin Override: ${remark}`, timestamp: new Date() });
    await complaint.save();

    await Notification.create({ user: complaint.citizen, message: `Your complaint "${complaint.title}" was reviewed via Super Admin override. Remark: ${remark}`, complaintId: complaint._id });

    const populated = await populateComplaint(Complaint.findById(complaint._id));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
