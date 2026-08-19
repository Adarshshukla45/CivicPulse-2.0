import express from "express";
import mongoose from "mongoose";
import { Complaint } from "../models/Complaint.js";
import { Department } from "../models/Department.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { parseCookies, verifyAccessToken } from "../utils/tokens.js";

const router = express.Router();

// Helper: optional user check from token
async function getOptionalUser(req) {
  try {
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies["accessToken"];
    }
    if (!token) return null;
    const decoded = verifyAccessToken(token);
    if (!decoded) return null;
    return await User.findById(decoded._id).select("-passwordHash");
  } catch (err) {
    return null;
  }
}

// Helper: format complaint with statusHistory changer names
async function formatComplaint(c) {
  if (!c) return null;
  const doc = c.toObject ? c.toObject() : { ...c };

  if (doc.statusHistory && doc.statusHistory.length > 0) {
    const populatedHistory = await Promise.all(
      doc.statusHistory.map(async h => {
        if (h.changedBy === "system") {
          return { ...h, changedBy: { name: "System" } };
        }
        if (mongoose.Types.ObjectId.isValid(h.changedBy)) {
          const u = await User.findById(h.changedBy).select("name email");
          return {
            ...h,
            changedBy: u ? { _id: u._id, name: u.name } : { name: "Officer" },
          };
        }
        return {
          ...h,
          changedBy: typeof h.changedBy === "object" ? h.changedBy : { name: String(h.changedBy || "Officer") },
        };
      })
    );
    doc.statusHistory = populatedHistory;
  }

  return doc;
}

// GET /api/complaints
router.get("/", async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    let filter = {};

    if (!user) {
      filter = { isPublic: true };
    } else if (user.role === "citizen") {
      filter = {
        $or: [{ citizen: user._id }, { isPublic: true }],
      };
    } else if (user.role === "dept_admin") {
      let deptName = "";
      if (user.department) {
        const userDept = await Department.findById(user.department);
        if (userDept) {
          deptName = userDept.name.toLowerCase();
        }
      }

      const orConditions = [];
      if (user.department) {
        orConditions.push({ department: user.department });
      }
      if (deptName) {
        orConditions.push({ category: new RegExp(deptName, "i") });
        if (deptName.includes("road")) {
          orConditions.push({ category: /road|pothole|street/i });
        } else if (deptName.includes("water")) {
          orConditions.push({ category: /water|pipe|drain|sewage/i });
        } else if (deptName.includes("power")) {
          orConditions.push({ category: /power|electr|light/i });
        } else if (deptName.includes("sanitat")) {
          orConditions.push({ category: /sanitat|garb|waste|trash/i });
        } else if (deptName.includes("health")) {
          orConditions.push({ category: /health|hospit|clinic|medic/i });
        }
      }

      filter = orConditions.length > 0 ? { $or: orConditions } : {};
    }
    // super_admin gets all without filter

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await Promise.all(complaints.map(formatComplaint));
    res.json(formatted);
  } catch (err) {
    console.error("[Get Complaints Error]:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// POST /api/complaints - Create Grievance
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, category, location, photos = [], departmentId } = req.body;

    if (!title || !description || !category || !location) {
      res.status(400).json({ error: "Title, description, category, and location are required." });
      return;
    }

    const allDepts = await Department.find();
    let targetDept = null;

    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      targetDept = await Department.findById(departmentId);
    }

    if (!targetDept && category) {
      const catLower = category.toLowerCase().trim();
      targetDept = allDepts.find(d => d.name.toLowerCase() === catLower);

      if (!targetDept) {
        targetDept = allDepts.find(d => d.name.toLowerCase().includes(catLower) || catLower.includes(d.name.toLowerCase()));
      }

      if (!targetDept) {
        if (catLower.includes("road") || catLower.includes("pothole") || catLower.includes("street")) {
          targetDept = allDepts.find(d => d.name.toLowerCase().includes("road"));
        } else if (catLower.includes("water") || catLower.includes("pipe") || catLower.includes("drain") || catLower.includes("sewage")) {
          targetDept = allDepts.find(d => d.name.toLowerCase().includes("water"));
        } else if (catLower.includes("power") || catLower.includes("electr") || catLower.includes("light")) {
          targetDept = allDepts.find(d => d.name.toLowerCase().includes("power"));
        } else if (catLower.includes("sanitat") || catLower.includes("garb") || catLower.includes("waste") || catLower.includes("trash")) {
          targetDept = allDepts.find(d => d.name.toLowerCase().includes("sanitat"));
        } else if (catLower.includes("health") || catLower.includes("hospit") || catLower.includes("clinic") || catLower.includes("medic")) {
          targetDept = allDepts.find(d => d.name.toLowerCase().includes("health"));
        }
      }
    }

    const finalDeptId = targetDept ? targetDept._id : (allDepts[0]?._id);

    const newComplaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      category: category.toLowerCase().trim(),
      department: finalDeptId,
      citizen: req.user._id,
      location: location.trim(),
      photos,
      status: "pending",
      tier: "local",
      isPublic: true,
      statusHistory: [
        {
          status: "pending",
          changedBy: req.user._id,
          role: req.user.role,
          remark: "Grievance submitted by citizen.",
          timestamp: new Date(),
        },
      ],
    });

    const populated = await Complaint.findById(newComplaint._id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await formatComplaint(populated);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("[Create Complaint Error]:", err);
    res.status(500).json({ error: "Failed to submit grievance." });
  }
});

// GET /api/complaints/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ error: "Invalid complaint ID format." });
      return;
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    if (!complaint) {
      res.status(404).json({ error: "Grievance not found." });
      return;
    }

    const formatted = await formatComplaint(complaint);
    res.json(formatted);
  } catch (err) {
    console.error("[Get Single Complaint Error]:", err);
    res.status(500).json({ error: "Failed to fetch grievance details." });
  }
});

// PUT /api/complaints/:id/status
router.put("/:id/status", authenticateToken, requireRole(["dept_admin", "super_admin"]), async (req, res) => {
  try {
    const { status, remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      res.status(404).json({ error: "Grievance not found." });
      return;
    }

    if (req.user.role === "dept_admin") {
      const userDeptId = String(req.user.department || "");
      const cDeptId = String(complaint.department || "");

      let matchesDept = userDeptId && userDeptId === cDeptId;
      if (!matchesDept && userDeptId) {
        const userDept = await Department.findById(userDeptId);
        if (userDept) {
          const deptName = userDept.name.toLowerCase();
          const cCat = (complaint.category || "").toLowerCase();
          matchesDept = deptName === cCat || cCat.includes(deptName) || deptName.includes(cCat);
        }
      }

      if (!matchesDept) {
        res.status(403).json({ error: "Not authorized to update complaints outside your department." });
        return;
      }
    }

    const validStatuses = ["pending", "in_review", "resolved", "rejected"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status value." });
      return;
    }

    const historyEntry = {
      status,
      changedBy: req.user._id,
      role: req.user.role,
      remark: remark || `Status changed to ${status.toUpperCase()} by ${req.user.name}`,
      timestamp: new Date(),
    };

    complaint.status = status;
    complaint.statusHistory.push(historyEntry);
    await complaint.save();

    // Department score adjustment
    const dept = await Department.findById(complaint.department);
    if (dept) {
      if (status === "resolved") {
        dept.governanceScore = Math.min(100, (dept.governanceScore || 100) + 5);
      } else if (status === "rejected") {
        dept.governanceScore = Math.max(10, (dept.governanceScore || 100) - 2);
      }
      await dept.save();
    }

    // Notify citizen
    if (complaint.citizen) {
      await Notification.create({
        recipient: complaint.citizen,
        message: `Status updated: Your grievance "${complaint.title}" is now ${status.toUpperCase()}.`,
        complaintId: complaint._id,
        read: false,
      });
    }

    const updated = await Complaint.findById(complaint._id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await formatComplaint(updated);
    res.json(formatted);
  } catch (err) {
    console.error("[Update Status Error]:", err);
    res.status(500).json({ error: "Failed to update complaint status." });
  }
});

// POST /api/complaints/:id/escalate
router.post("/:id/escalate", authenticateToken, requireRole(["citizen"]), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      res.status(404).json({ error: "Grievance not found." });
      return;
    }

    if (String(complaint.citizen) !== String(req.user._id)) {
      res.status(403).json({ error: "Only the filing citizen can escalate this grievance." });
      return;
    }

    // Hard Cap: If already at state tier, block further escalation
    if (complaint.tier === "state") {
      res.status(400).json({ error: "Grievance is already at the highest (STATE) tier. No further escalation can occur." });
      return;
    }

    const allowedToEscalate = complaint.status === "rejected" || complaint.status === "pending" || complaint.status === "in_review" || complaint.status === "escalated";
    if (!allowedToEscalate) {
      res.status(400).json({ error: "Resolved complaints cannot be escalated." });
      return;
    }

    const nextTier = complaint.tier === "local" ? "district" : "state";
    complaint.status = "escalated";
    complaint.tier = nextTier;
    complaint.escalatedAt = new Date();

    if (nextTier === "state") {
      complaint.isPublic = true;
    }

    complaint.statusHistory.push({
      status: "escalated",
      changedBy: req.user._id,
      role: "citizen",
      remark: `Manually escalated by citizen to ${nextTier.toUpperCase()} level.`,
      timestamp: new Date(),
    });

    await complaint.save();

    // Score penalty
    const dept = await Department.findById(complaint.department);
    if (dept) {
      dept.governanceScore = Math.max(10, (dept.governanceScore || 100) - 15);
      await dept.save();
    }

    const updated = await Complaint.findById(complaint._id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await formatComplaint(updated);
    res.json(formatted);
  } catch (err) {
    console.error("[Escalate Complaint Error]:", err);
    res.status(500).json({ error: "Failed to escalate grievance." });
  }
});

// POST /api/complaints/:id/override - Super Admin Override
router.post("/:id/override", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { status = "resolved", remark } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      res.status(404).json({ error: "Grievance not found." });
      return;
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      changedBy: req.user._id,
      role: "super_admin",
      remark: remark || `Super Admin structural override executed. Status updated to ${status.toUpperCase()}.`,
      timestamp: new Date(),
    });

    await complaint.save();

    if (complaint.citizen) {
      await Notification.create({
        recipient: complaint.citizen,
        message: `Super Admin Override: Grievance "${complaint.title}" was updated to ${status.toUpperCase()}.`,
        complaintId: complaint._id,
        read: false,
      });
    }

    const updated = await Complaint.findById(complaint._id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await formatComplaint(updated);
    res.json(formatted);
  } catch (err) {
    console.error("[Super Admin Override Error]:", err);
    res.status(500).json({ error: "Failed to override grievance." });
  }
});

// POST /api/complaints/:id/rate - Satisfaction Feedback
router.post("/:id/rate", authenticateToken, requireRole(["citizen"]), async (req, res) => {
  try {
    const { rating } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      res.status(404).json({ error: "Grievance not found." });
      return;
    }

    if (String(complaint.citizen) !== String(req.user._id)) {
      res.status(403).json({ error: "Only the owner can rate this resolution." });
      return;
    }

    if (complaint.status !== "resolved") {
      res.status(400).json({ error: "Only resolved grievances can receive citizen ratings." });
      return;
    }

    const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
    complaint.satisfactionRating = ratingNum;
    complaint.statusHistory.push({
      status: "resolved",
      changedBy: req.user._id,
      role: "citizen",
      remark: `Citizen rated this resolution ${ratingNum} Stars.`,
      timestamp: new Date(),
    });

    await complaint.save();

    const dept = await Department.findById(complaint.department);
    if (dept) {
      let scoreChange = 0;
      if (ratingNum >= 4) scoreChange = 3;
      if (ratingNum <= 2) scoreChange = -4;

      dept.governanceScore = Math.max(10, Math.min(100, (dept.governanceScore || 100) + scoreChange));
      await dept.save();
    }

    const updated = await Complaint.findById(complaint._id)
      .populate("citizen", "name email role")
      .populate("department", "name tier slaDays");

    const formatted = await formatComplaint(updated);
    res.json(formatted);
  } catch (err) {
    console.error("[Rate Complaint Error]:", err);
    res.status(500).json({ error: "Failed to rate grievance." });
  }
});

export default router;
