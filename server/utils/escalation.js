import { Complaint } from "../models/Complaint.js";
import { Department } from "../models/Department.js";
import { Notification } from "../models/Notification.js";

export async function scanAndEscalateComplaints() {
  try {
    const now = new Date();
    const complaints = await Complaint.find({
      status: { $in: ["pending", "in_review", "escalated"] },
      tier: { $ne: "state" }, // Stop if already at state level
    }).populate("department");

    let updatedCount = 0;

    for (const c of complaints) {
      // Do not escalate resolved or rejected tickets
      if (c.status === "resolved" || c.status === "rejected") {
        continue;
      }

      const dept = c.department;
      if (!dept) continue;

      const baseTime = c.escalatedAt ? new Date(c.escalatedAt) : new Date(c.createdAt);
      const diffMs = now.getTime() - baseTime.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays > dept.slaDays) {
        const oldTier = c.tier;
        let nextTier = null;
        let nextStatus = "escalated";

        if (c.tier === "local") {
          nextTier = "district";
        } else if (c.tier === "district") {
          nextTier = "state";
          c.isPublic = true; // State tier escalated complaints are strictly made public
        } else {
          continue; // Safety: no escalation past state level
        }

        c.status = nextStatus;
        c.tier = nextTier;
        c.escalatedAt = now;

        c.statusHistory.push({
          status: nextStatus,
          changedBy: "system",
          role: "system",
          remark: `Automated SLA Violation: Escalated from ${oldTier.toUpperCase()} to ${nextTier.toUpperCase()} level due to ${dept.slaDays}-day SLA timeout.`,
          timestamp: now,
        });

        await c.save();

        // Penalize department governance score
        const newScore = Math.max(10, (dept.governanceScore || 100) - 10);
        await Department.findByIdAndUpdate(dept._id, { governanceScore: newScore });

        // Notify citizen
        if (c.citizen) {
          await Notification.create({
            recipient: c.citizen,
            message: `Urgent: Grievance "${c.title}" breached ${dept.name} SLA and was automatically escalated to ${nextTier.toUpperCase()} Authority!`,
            complaintId: c._id,
            read: false,
          });
        }

        updatedCount++;
      }
    }

    return updatedCount;
  } catch (err) {
    console.error("[SLA Scanner Execution Error]:", err);
    return 0;
  }
}

export default scanAndEscalateComplaints;
