import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./server/config/db.js";
import apiRouter from "./server/routes/index.js";
import { scanAndEscalateComplaints } from "./server/utils/escalation.js";

async function startServer() {
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err) {
    console.error("[Fatal] Failed to connect to MongoDB:", err);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb", parameterLimit: 50000 }));

  // Mount API router
  app.use("/api", apiRouter);

  // Background SLA checks (every 5 minutes)
  setInterval(() => {
    try {
      console.log("[Cron SLA Scanner] Running periodic SLA checks...");
      scanAndEscalateComplaints();
    } catch (err) {
      console.error("[Cron SLA Scanner Error]:", err);
    }
  }, 5 * 60 * 1000);

  // Initial SLA check after 5 seconds
  setTimeout(() => {
    try {
      console.log("[Startup SLA Scanner] Running initial database scan...");
      scanAndEscalateComplaints();
    } catch (err) {
      console.error("[Startup SLA Scanner Error]:", err);
    }
  }, 5000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware mounted in DEVELOPMENT mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[Server] Static file serving configured in PRODUCTION mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] CivicPulse server running on http://localhost:${PORT}`);
  });
}

startServer();
