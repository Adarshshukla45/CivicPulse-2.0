import express from "express";
import authRoutes from "./auth.js";
import complaintsRoutes from "./complaints.js";
import departmentsRoutes from "./departments.js";
import notificationsRoutes from "./notifications.js";
import usersRoutes from "./users.js";
import analyticsRoutes from "./analytics.js";
import aiRoutes from "./ai.js";
import cronRoutes from "./cron.js";
import { scanAndEscalateComplaints } from "../utils/escalation.js";

const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/complaints", complaintsRoutes);
apiRouter.use("/departments", departmentsRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/cron", cronRoutes);

export { scanAndEscalateComplaints };
export default apiRouter;
