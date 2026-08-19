import { verifyAccessToken, parseCookies } from "../utils/tokens.js";
import { User } from "../models/User.js";

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies["accessToken"];
    }

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      res.status(403).json({ error: "Invalid or expired access token" });
      return;
    }

    const user = await User.findById(decoded._id).select("-passwordHash");
    if (!user) {
      res.status(403).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth Middleware Error]:", err);
    res.status(500).json({ error: "Authentication verification failed" });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient privileges" });
      return;
    }
    next();
  };
}
