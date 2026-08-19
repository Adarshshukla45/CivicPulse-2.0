import express from "express";
import { Department } from "../models/Department.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/departments - List all departments
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().populate("admin", "name email");
    res.json(departments);
  } catch (err) {
    console.error("[Get Departments Error]:", err);
    res.status(500).json({ error: "Failed to fetch departments." });
  }
});

// GET /api/departments/:id
router.get("/:id", async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate("admin", "name email");
    if (!dept) {
      res.status(404).json({ error: "Department not found." });
      return;
    }
    res.json(dept);
  } catch (err) {
    console.error("[Get Department Error]:", err);
    res.status(500).json({ error: "Failed to fetch department." });
  }
});

// POST /api/departments - Create department (Super Admin only)
router.post("/", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { name, slaDays = 3, tier = "local", admin } = req.body;
    if (!name) {
      res.status(400).json({ error: "Department name is required." });
      return;
    }

    const existing = await Department.findOne({ name: new RegExp(`^${name.trim()}$`, "i") });
    if (existing) {
      res.status(400).json({ error: "Department already exists." });
      return;
    }

    const created = await Department.create({
      name: name.trim(),
      slaDays: Number(slaDays) || 3,
      tier,
      admin: admin || undefined,
      governanceScore: 100,
    });

    const populated = await Department.findById(created._id).populate("admin", "name email");
    res.status(201).json(populated);
  } catch (err) {
    console.error("[Create Department Error]:", err);
    res.status(500).json({ error: "Failed to create department." });
  }
});

// PUT /api/departments/:id/sla - Update SLA days (Super Admin only)
router.put("/:id/sla", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { slaDays } = req.body;
    const daysNum = parseInt(slaDays, 10);

    if (isNaN(daysNum) || daysNum <= 0) {
      res.status(400).json({ error: "Valid positive number of SLA days required." });
      return;
    }

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { slaDays: daysNum },
      { new: true }
    ).populate("admin", "name email");

    if (!updated) {
      res.status(404).json({ error: "Department not found." });
      return;
    }

    res.json(updated);
  } catch (err) {
    console.error("[Update SLA Error]:", err);
    res.status(500).json({ error: "Failed to update SLA." });
  }
});

export default router;
