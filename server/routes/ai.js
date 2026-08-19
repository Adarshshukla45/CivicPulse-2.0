import express from "express";
import { analyzeComplaintText, generateGovernanceRecommendations } from "../ai.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { Department } from "../models/Department.js";
import { Complaint } from "../models/Complaint.js";

const router = express.Router();

// POST /api/ai/analyze-complaint and /api/ai/analyze-grievance
const handleAnalyze = async (req, res) => {
  const { description } = req.body;
  if (!description) {
    res.status(400).json({ error: "Grievance description text is required." });
    return;
  }
  const result = await analyzeComplaintText(description);
  res.json(result);
};

router.post("/analyze-complaint", handleAnalyze);
router.post("/analyze-grievance", handleAnalyze);

// POST /api/ai/governance-report (Super Admin only)
router.post("/governance-report", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const departments = await Department.find();
    const complaints = await Complaint.find();
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === "resolved").length;

    const report = await generateGovernanceRecommendations(departments, total, resolved);
    res.json({ report });
  } catch (err) {
    console.error("[Governance Report Error]:", err);
    res.status(500).json({ error: "Failed to generate AI governance report." });
  }
});

export default router;
