import express from 'express';
import Department from '../models/Department.js';
import Complaint from '../models/Complaint.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public — get all departments with scores
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('admin', 'name email');
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const departments = await Department.find().sort({ governanceScore: -1 });
    const complaints = await Complaint.find();

    const leaderboard = departments.map(d => {
      const dComplaints = complaints.filter(c => c.department?.toString() === d._id.toString());
      const resolved = dComplaints.filter(c => c.status === 'resolved');
      return {
        _id: d._id, name: d.name, tier: d.tier, slaDays: d.slaDays,
        governanceScore: d.governanceScore,
        totalComplaints: dComplaints.length,
        resolvedCount: resolved.length,
        pendingCount: dComplaints.filter(c => ['pending', 'in_review'].includes(c.status)).length,
        escalatedCount: dComplaints.filter(c => c.status === 'escalated').length,
        resolutionRate: dComplaints.length > 0 ? Math.round((resolved.length / dComplaints.length) * 100) : 100,
      };
    });

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update department (SLA, score etc) — super admin only
router.put('/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create department — super admin only
router.post('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
