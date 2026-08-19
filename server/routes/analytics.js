import express from "express";
import { Complaint } from "../models/Complaint.js";
import { Department } from "../models/Department.js";

const router = express.Router();

// GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    const departments = await Department.find();

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === "pending").length;
    const in_review = complaints.filter(c => c.status === "in_review").length;
    const escalated = complaints.filter(c => c.status === "escalated").length;
    const resolved = complaints.filter(c => c.status === "resolved").length;
    const rejected = complaints.filter(c => c.status === "rejected").length;

    const ratedComplaints = complaints.filter(c => c.satisfactionRating !== undefined && c.satisfactionRating !== null);
    const avgSatisfaction = ratedComplaints.length > 0
      ? (ratedComplaints.reduce((acc, c) => acc + c.satisfactionRating, 0) / ratedComplaints.length).toFixed(1)
      : "4.8";

    // Category distribution
    const categoryCounts = {};
    complaints.forEach(c => {
      const cat = c.category || "other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));

    // Department scores & performance
    const departmentStats = departments.map(d => {
      const deptComplaints = complaints.filter(c => {
        const cDeptId = String(c.department || "");
        return cDeptId === String(d._id) || (c.category && c.category.toLowerCase() === d.name.toLowerCase());
      });

      const deptResolved = deptComplaints.filter(c => c.status === "resolved").length;
      const deptEscalated = deptComplaints.filter(c => c.status === "escalated").length;
      const resolutionRate = deptComplaints.length > 0
        ? Math.round((deptResolved / deptComplaints.length) * 100)
        : 100;

      return {
        _id: d._id,
        name: d.name,
        slaDays: d.slaDays,
        tier: d.tier,
        governanceScore: d.governanceScore || 100,
        totalComplaints: deptComplaints.length,
        resolved: deptResolved,
        escalated: deptEscalated,
        resolutionRate,
      };
    });

    const totalBreaches = escalated;
    const slaCompliance = total > 0
      ? Math.max(0, Math.round(((total - totalBreaches) / total) * 100))
      : 100;

    res.json({
      stats: {
        total,
        pending,
        in_review,
        escalated,
        resolved,
        rejected,
      },
      avgSatisfaction: Number(avgSatisfaction),
      slaCompliance,
      categoryDistribution,
      departments: departmentStats,
    });
  } catch (err) {
    console.error("[Get Analytics Error]:", err);
    res.status(500).json({ error: "Failed to generate analytics." });
  }
});

export default router;
