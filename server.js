import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import connectDB from './server/config/db.js';
import { seedDatabase } from './server/utils/seed.js';
import { startEscalationCron } from './server/utils/escalation.js';

import authRoutes from './server/routes/auth.js';
import complaintRoutes from './server/routes/complaints.js';
import departmentRoutes from './server/routes/departments.js';
import notificationRoutes from './server/routes/notifications.js';
import analyticsRoutes from './server/routes/analytics.js';
import userRoutes from './server/routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  // Connect MongoDB
  await connectDB();

  // Seed database if empty
  await seedDatabase();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/users', userRoutes);

  // Start escalation cron
  startEscalationCron();

  // Vite dev server or static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
    console.log('[Server] Vite dev middleware mounted');
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CivicPulse] Server running at http://localhost:${PORT}`);
  });
}

startServer();
