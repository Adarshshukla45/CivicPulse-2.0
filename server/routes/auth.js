import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import {
  generateTokens,
  setTokenCookies,
  clearTokenCookies,
  parseCookies,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register new citizen or officer
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "citizen", department } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Missing required registration fields" });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({ error: "Email address already registered." });
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

    const { accessToken, refreshToken } = generateTokens(safeUser);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("[Auth Register Error]:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    const { accessToken, refreshToken } = generateTokens(safeUser);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      user: safeUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("[Auth Login Error]:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Logout
router.post("/logout", (req, res) => {
  clearTokenCookies(res);
  res.json({ message: "Successfully logged out." });
});

// Get Current User Profile
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Refresh JWT Access Token
router.post("/refresh", async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = req.body.refreshToken || cookies["refreshToken"];

    if (!token) {
      res.status(401).json({ error: "Refresh token missing" });
      return;
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      res.status(403).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      res.status(403).json({ error: "User not found" });
      return;
    }

    const safeUser = user.toSafeObject ? user.toSafeObject() : {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(safeUser);
    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("[Auth Refresh Error]:", err);
    res.status(500).json({ error: "Token refresh failed." });
  }
});

export default router;
