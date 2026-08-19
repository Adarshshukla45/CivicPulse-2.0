import express from "express";
import { Notification } from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) {
    console.error("[Get Notifications Error]:", err);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("[Mark All Read Error]:", err);
    res.status(500).json({ error: "Failed to mark notifications as read." });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }
    if (String(notif.recipient) !== String(req.user._id)) {
      res.status(403).json({ error: "Unauthorized access to notification." });
      return;
    }

    notif.read = true;
    await notif.save();
    res.json(notif);
  } catch (err) {
    console.error("[Mark Read Error]:", err);
    res.status(500).json({ error: "Failed to mark notification as read." });
  }
});

export default router;
