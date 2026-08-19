import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Complaint } from "../models/Complaint.js";
import { Notification } from "../models/Notification.js";

export async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log("[Database Seed] Database already contains records. Skipping seed.");
      return;
    }

    console.log("[Database Seed] Seeding initial MongoDB data...");

    const adminPasswordHash = bcrypt.hashSync("adminpassword", 10);
    const citizenPasswordHash = bcrypt.hashSync("citizen123", 10);
    const deptAdminPasswordHash = bcrypt.hashSync("admin123", 10);

    // 1. Create Super Admin & Citizens
    const superAdmin = await User.create({
      name: "Super Admin HQ",
      email: "admin@civicpulse.org",
      role: "super_admin",
      passwordHash: adminPasswordHash,
    });

    const citizen1 = await User.create({
      name: "Aarav Sharma",
      email: "aarav@gmail.com",
      role: "citizen",
      passwordHash: citizenPasswordHash,
    });

    const citizen2 = await User.create({
      name: "Priya Patel",
      email: "priya@gmail.com",
      role: "citizen",
      passwordHash: citizenPasswordHash,
    });

    // 2. Create Departments & Officers
    const deptsConfig = [
      { name: "Roads", slaDays: 3, officerName: "Rajesh Roads Officer", officerEmail: "roads@civicpulse.org", score: 88 },
      { name: "Water", slaDays: 3, officerName: "Suresh Water Officer", officerEmail: "water@civicpulse.org", score: 92 },
      { name: "Power", slaDays: 2, officerName: "Vikram Power Officer", officerEmail: "power@civicpulse.org", score: 84 },
      { name: "Sanitation", slaDays: 3, officerName: "Anita Sanitation Officer", officerEmail: "sanitation@civicpulse.org", score: 90 },
      { name: "Health", slaDays: 2, officerName: "Dr. Neha Health Officer", officerEmail: "health@civicpulse.org", score: 95 },
    ];

    const departmentDocs = {};

    for (const conf of deptsConfig) {
      const dept = await Department.create({
        name: conf.name,
        slaDays: conf.slaDays,
        tier: "local",
        governanceScore: conf.score,
      });

      const officer = await User.create({
        name: conf.officerName,
        email: conf.officerEmail,
        role: "dept_admin",
        department: dept._id,
        passwordHash: deptAdminPasswordHash,
      });

      dept.admin = officer._id;
      await dept.save();

      departmentDocs[conf.name] = { dept, officer };
    }

    // 3. Create Sample Complaints
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const comp1 = await Complaint.create({
      title: "Dangerous Deep Pothole on 5th Main Cross",
      description: "A 2-foot deep pothole has emerged right after the monsoon rains near the primary school crossroad.",
      category: "roads",
      department: departmentDocs["Roads"].dept._id,
      citizen: citizen1._id,
      location: "5th Main Cross Road, Sector 4",
      status: "pending",
      tier: "local",
      photos: ["https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80"],
      isPublic: true,
      createdAt: fourDaysAgo,
      statusHistory: [
        {
          status: "pending",
          changedBy: citizen1._id,
          role: "citizen",
          remark: "Grievance submitted by citizen.",
          timestamp: fourDaysAgo,
        },
      ],
    });

    const comp2 = await Complaint.create({
      title: "Main Water Pipeline Burst & Flooding",
      description: "Potable water line burst causing flooding on the street and water shortage in 50 residential units.",
      category: "water",
      department: departmentDocs["Water"].dept._id,
      citizen: citizen2._id,
      location: "Riverdale Road, Block C",
      status: "in_review",
      tier: "local",
      photos: ["https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80"],
      isPublic: true,
      createdAt: twoDaysAgo,
      statusHistory: [
        {
          status: "pending",
          changedBy: citizen2._id,
          role: "citizen",
          remark: "Grievance submitted.",
          timestamp: twoDaysAgo,
        },
        {
          status: "in_review",
          changedBy: departmentDocs["Water"].officer._id,
          role: "dept_admin",
          remark: "Assigned inspection team to examine pipeline valve.",
          timestamp: oneDayAgo,
        },
      ],
    });

    const comp3 = await Complaint.create({
      title: "Low Voltage Fluctuations in Ward 11",
      description: "Dangerous voltage drops causing home appliances to shut down repeatedly in the evenings.",
      category: "power",
      department: departmentDocs["Power"].dept._id,
      citizen: citizen1._id,
      location: "Ward 11, Green Hills Layout",
      status: "resolved",
      tier: "local",
      satisfactionRating: 5,
      photos: ["https://images.unsplash.com/photo-1513828742140-ccaa34f37288?auto=format&fit=crop&w=600&q=80"],
      isPublic: true,
      createdAt: fourDaysAgo,
      statusHistory: [
        {
          status: "pending",
          changedBy: citizen1._id,
          role: "citizen",
          remark: "Grievance submitted.",
          timestamp: fourDaysAgo,
        },
        {
          status: "resolved",
          changedBy: departmentDocs["Power"].officer._id,
          role: "dept_admin",
          remark: "Replaced faulty transformer capacitor at substation.",
          timestamp: oneDayAgo,
        },
      ],
    });

    const comp4 = await Complaint.create({
      title: "Overflowing Garbage Dump near Market Area",
      description: "Sanitation trucks haven't picked up municipal bins for 4 days creating foul odor and health hazards.",
      category: "sanitation",
      department: departmentDocs["Sanitation"].dept._id,
      citizen: citizen2._id,
      location: "Central Market Complex, Gate 2",
      status: "pending",
      tier: "local",
      photos: ["https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80"],
      isPublic: true,
      createdAt: threeHoursAgo,
      statusHistory: [
        {
          status: "pending",
          changedBy: citizen2._id,
          role: "citizen",
          remark: "Grievance submitted.",
          timestamp: threeHoursAgo,
        },
      ],
    });

    // 4. Create Notification
    await Notification.create({
      recipient: citizen1._id,
      message: "Your Power complaint 'Low Voltage Fluctuations in Ward 11' has been marked RESOLVED by Power Department.",
      complaintId: comp3._id,
      read: false,
      createdAt: oneDayAgo,
    });

    console.log("[Database Seed] Seeded MongoDB collections successfully.");
  } catch (err) {
    console.error("[Database Seed Error]:", err);
  }
}
