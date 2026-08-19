import express from "express";
import { scanAndEscalateComplaints } from "../utils/escalation.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// POST /api/cron/trigger-escalation
router.post("/trigger-escalation", authenticateToken, requireRole(["super_admin"]), (req, res) => {
  try {
    const updatedCount = scanAndEscalateComplaints();
    res.json({
      success: true,
      message: `SLA escalation cycle executed. ${updatedCount} grievances updated.`,
      escalatedCount: updatedCount,
    });
  } catch (err) {
    console.error("[Manual SLA Trigger Error]:", err);
    res.status(500).json({ error: "SLA scan execution failed." });
  }
});

router.post("/escalate", authenticateToken, requireRole(["super_admin"]), (req, res) => {
  try {
    const updatedCount = scanAndEscalateComplaints();
    res.json({
      success: true,
      message: `SLA escalation cycle executed. ${updatedCount} grievances updated.`,
      escalatedCount: updatedCount,
    });
  } catch (err) {
    console.error("[Manual SLA Trigger Error]:", err);
    res.status(500).json({ error: "SLA scan execution failed." });
  }
});

export default router;
