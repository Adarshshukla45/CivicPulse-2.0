import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';

export const scanAndEscalateComplaints = async () => {
  const now = new Date();
  const complaints = await Complaint.find({ status: { $in: ['pending', 'in_review', 'escalated'] } }).populate('department');

  let escalatedCount = 0;

  for (const c of complaints) {
    const dept = c.department;
    if (!dept) continue;

    const createdAt = new Date(c.createdAt);
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    if (diffDays > dept.slaDays) {
      if (c.tier === 'local') {
        c.tier = 'district';
        c.status = 'escalated';
        c.escalatedAt = now;
        c.statusHistory.push({ status: 'escalated', changedBy: null, role: 'system', remark: `Auto-escalated: SLA of ${dept.slaDays} days exceeded at local tier.`, timestamp: now });
        dept.governanceScore = Math.max(10, dept.governanceScore - 12);
        await dept.save();
        await c.save();
        escalatedCount++;
      } else if (c.tier === 'district') {
        c.tier = 'state';
        c.status = 'escalated';
        c.isPublic = true;
        c.escalatedAt = now;
        c.statusHistory.push({ status: 'escalated', changedBy: null, role: 'system', remark: `Auto-escalated: SLA exceeded at district tier. Complaint is now PUBLIC.`, timestamp: now });
        dept.governanceScore = Math.max(10, dept.governanceScore - 15);
        await dept.save();
        await c.save();
        escalatedCount++;
      }
    }
  }

  console.log(`[Escalation Cron] Checked. Escalated: ${escalatedCount} complaints.`);
};

export const startEscalationCron = () => {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running SLA escalation check...');
    await scanAndEscalateComplaints();
  });

  // Run once on startup after 5 seconds
  setTimeout(async () => {
    console.log('[Startup] Running initial SLA check...');
    await scanAndEscalateComplaints();
  }, 5000);

  console.log('[Cron] Escalation cron scheduled (every 6 hours)');
};
