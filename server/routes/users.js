import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users - List users (Super Admin only)
router.get("/", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").populate("department", "name");
    res.json(users);
  } catch (err) {
    console.error("[Get Users Error]:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// POST /api/users - Create User / Officer (Super Admin only)
router.post("/", authenticateToken, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { name, email, role, department, password } = req.body;
    if (!name || !email || !role || !password) {
      res.status(400).json({ error: "Name, email, role, and password are required." });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(400).json({ error: "Email already registered." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      department: role === "dept_admin" && department ? department : undefined,
      passwordHash,
    });

    const safeUser = newUser.toSafeObject ? newUser.toSafeObject() : {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    };

    res.status(201).json(safeUser);
  } catch (err) {
    console.error("[Create User Error]:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
});

export default router;
