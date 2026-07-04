import express from 'express';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find();
    const departments = await Department.find();

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      in_review: complaints.filter(c => c.status === 'in_review').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
      escalated: complaints.filter(c => c.status === 'escalated').length,
    };

    const deptsPerformance = departments.map(d => {
      const dComplaints = complaints.filter(c => c.department?.toString() === d._id.toString());
      const resolved = dComplaints.filter(c => c.status === 'resolved');
      const ratedOnes = resolved.filter(c => c.satisfactionRating);
      const avgRating = ratedOnes.length > 0 ? Number((ratedOnes.reduce((a, c) => a + c.satisfactionRating, 0) / ratedOnes.length).toFixed(1)) : 0;

      return {
        _id: d._id, name: d.name,
        governanceScore: d.governanceScore,
        totalComplaints: dComplaints.length,
        resolvedCount: resolved.length,
        pendingCount: dComplaints.filter(c => ['pending', 'in_review'].includes(c.status)).length,
        escalatedCount: dComplaints.filter(c => c.status === 'escalated').length,
        avgRating,
        slaComplianceRate: resolved.length > 0 ? Math.round((resolved.filter(c => {
          const resItem = c.statusHistory.find(h => h.status === 'resolved');
          if (!resItem) return false;
          return (new Date(resItem.timestamp) - c.createdAt) / 86400000 <= d.slaDays;
        }).length / resolved.length) * 100) : 100,
      };
    });

    const categoryDistribution = ['roads', 'water', 'power', 'sanitation', 'health', 'other'].map(cat => ({
      category: cat.toUpperCase(),
      count: complaints.filter(c => c.category === cat).length,
    }));

    const ratedAll = complaints.filter(c => c.satisfactionRating);
    const avgSatisfaction = ratedAll.length > 0 ? Number((ratedAll.reduce((a, c) => a + c.satisfactionRating, 0) / ratedAll.length).toFixed(1)) : 4.2;

    res.json({ stats, departments: deptsPerformance, categoryDistribution, avgSatisfaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
