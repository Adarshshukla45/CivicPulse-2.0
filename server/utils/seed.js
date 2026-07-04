import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Complaint from '../models/Complaint.js';

export const seedDatabase = async () => {
  try {
    const existingDepts = await Department.countDocuments();
    if (existingDepts > 0) {
      console.log('[Seed] Database already seeded. Skipping.');
      return;
    }

    console.log('[Seed] Seeding database...');

    // Create departments
    const deptNames = ['Roads', 'Water', 'Power', 'Sanitation', 'Health'];
    const departments = await Department.insertMany(
      deptNames.map(name => ({ name, tier: 'local', slaDays: 3, governanceScore: 100 }))
    );

    // Super Admin
    const adminHash = await bcrypt.hash('adminpassword', 10);
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@civicpulse.org',
      passwordHash: adminHash,
      role: 'super_admin',
    });

    // Dept Admins
    const deptAdminHash = await bcrypt.hash('admin123', 10);
    for (const dept of departments.slice(0, 2)) {
      const deptAdmin = await User.create({
        name: `${dept.name} Officer`,
        email: `${dept.name.toLowerCase()}@civicpulse.org`,
        passwordHash: deptAdminHash,
        role: 'dept_admin',
        department: dept._id,
      });
      dept.admin = deptAdmin._id;
      await dept.save();
    }

    // Citizens
    const citizenHash = await bcrypt.hash('citizen123', 10);
    const citizen1 = await User.create({ name: 'Aarav Sharma', email: 'aarav@gmail.com', passwordHash: citizenHash, role: 'citizen' });
    const citizen2 = await User.create({ name: 'Priya Patel', email: 'priya@gmail.com', passwordHash: citizenHash, role: 'citizen' });

    // Sample complaints
    const roadsDept = departments.find(d => d.name === 'Roads');
    const waterDept = departments.find(d => d.name === 'Water');
    const sanDept = departments.find(d => d.name === 'Sanitation');

    await Complaint.insertMany([
      {
        title: 'Huge Pothole on Main Street',
        description: 'A massive pothole near central junction causing tire damage. Major safety hazard.',
        category: 'roads', location: 'Central Junction, Ward 4',
        photos: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80'],
        status: 'pending', tier: 'local', citizen: citizen1._id, department: roadsDept._id,
        statusHistory: [{ status: 'pending', changedBy: citizen1._id, role: 'citizen', remark: 'Complaint registered.', timestamp: new Date(Date.now() - 2 * 86400000) }],
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        title: 'Dirty Water Supply',
        description: 'Water from municipal taps is contaminated with mud and has foul odor for last 3 days.',
        category: 'water', location: 'Block B, Green Glen Layout',
        photos: ['https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80'],
        status: 'in_review', tier: 'local', citizen: citizen2._id, department: waterDept._id,
        statusHistory: [
          { status: 'pending', changedBy: citizen2._id, role: 'citizen', remark: 'Reported water contamination.', timestamp: new Date(Date.now() - 4 * 86400000) },
          { status: 'in_review', changedBy: null, role: 'dept_admin', remark: 'Water sample sent to lab. Inspection scheduled.', timestamp: new Date(Date.now() - 3 * 86400000) },
        ],
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        title: 'Uncollected Garbage — Foul Smell',
        description: 'Garbage not collected for over a week. Strays scattering it everywhere.',
        category: 'sanitation', location: 'Lane 12, Sunnyvale',
        photos: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80'],
        status: 'resolved', tier: 'local', citizen: citizen1._id, department: sanDept._id,
        satisfactionRating: 5,
        statusHistory: [
          { status: 'pending', changedBy: citizen1._id, role: 'citizen', remark: 'Trash piled up.', timestamp: new Date(Date.now() - 5 * 86400000) },
          { status: 'resolved', changedBy: superAdmin._id, role: 'super_admin', remark: 'Sanitation truck deployed. Area cleared.', timestamp: new Date(Date.now() - 86400000) },
        ],
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
    ]);

    console.log('[Seed] ✅ Database seeded successfully!');
    console.log('[Seed] Super Admin → admin@civicpulse.org / adminpassword');
    console.log('[Seed] Dept Admin  → roads@civicpulse.org / admin123');
    console.log('[Seed] Citizen     → aarav@gmail.com / citizen123');

  } catch (err) {
    console.error('[Seed] Error:', err.message);
  }
};
