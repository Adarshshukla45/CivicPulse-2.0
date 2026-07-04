import express from 'express';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash -refreshToken').populate('department', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/role', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { role, department } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role, department: department || null }, { new: true }).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role === 'dept_admin' && department) {
      await Department.findByIdAndUpdate(department, { admin: user._id });
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
