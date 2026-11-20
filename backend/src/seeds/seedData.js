const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const {
  User,
  Branch,
  Batch,
  Instructor,
  MembershipPackage,
  Student,
  StudentMembership,
  Attendance,
  Payment,
  Reminder,
  AuditLog,
  Settings
} = require('../models');
const { calculateExpiryDate, formatDate } = require('../utils/dateUtils');
const { generateReceiptNumber } = require('../services/membershipService');

async function seed() {
  console.log('🥋 [Seed] Starting Samurai Academy database seeding...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Branch.deleteMany({}),
    Batch.deleteMany({}),
    Instructor.deleteMany({}),
    MembershipPackage.deleteMany({}),
    Student.deleteMany({}),
    StudentMembership.deleteMany({}),
    Attendance.deleteMany({}),
    Payment.deleteMany({}),
    Reminder.deleteMany({}),
    AuditLog.deleteMany({}),
    Settings.deleteMany({})
  ]);

  // 1. Settings
  const settings = await Settings.create({
    academyName: 'Samurai Martial Arts & Fitness Academy',
    tagline: 'Discipline • Strength • Honor',
    address: '850 Bushido Way, Metro Martial Arts District, CA 90210',
    phone: '+1 (555) 726-8724',
    email: 'contact@samuraiacademy.com',
    currency: '$',
    whatsappCountryCode: '+1',
    reminderTemplates: {
      upcoming7: 'Dear {student_name}, this is a friendly reminder that your {package_name} membership at {academy_name} will expire in 7 days on {expiry_date}. Amount due: {amount_due}. Please renew on time to keep training!',
      upcoming3: 'Dear {student_name}, your membership at {academy_name} expires in 3 days on {expiry_date}. Renewal fee: {amount_due}. Please renew at the front desk or via online portal.',
      upcoming1: 'URGENT: Dear {student_name}, your membership at {academy_name} expires TOMORROW ({expiry_date}). Please submit renewal ({amount_due}) to prevent interruption in class access.',
      onExpiry: 'Dear {student_name}, your {package_name} membership at {academy_name} expires TODAY ({expiry_date}). Renewal fee: {amount_due}. Renew today!',
      expired: 'Dear {student_name}, your membership at {academy_name} expired on {expiry_date}. Please contact the reception desk or pay online to reactivate your training.'
    }
  });

  // 2. Single Primary Branch
  const b1 = await Branch.create({
    name: 'Samurai Martial Arts Academy (Main Branch)',
    code: 'SAM',
    address: '850 Bushido Way, Sector 1, Martial Arts District',
    phone: '+1 (555) 726-8701',
    email: 'contact@samuraiacademy.com'
  });

  // 3. Batches (All operating at Main Branch)
  const batch1 = await Batch.create({
    name: 'Morning Warriors (Karate & Conditioning)',
    branch: b1._id,
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '06:00 AM',
    endTime: '07:30 AM',
    capacity: 25
  });
  const batch2 = await Batch.create({
    name: 'Evening BJJ Masters (Gi & No-Gi)',
    branch: b1._id,
    days: ['Mon', 'Tue', 'Thu'],
    startTime: '05:30 PM',
    endTime: '07:00 PM',
    capacity: 30
  });
  const batch3 = await Batch.create({
    name: 'Youth Karate Dragons (Kids 6-12)',
    branch: b1._id,
    days: ['Tue', 'Thu', 'Sat'],
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    capacity: 20
  });
  const batch4 = await Batch.create({
    name: 'Muay Thai Strike Crew',
    branch: b1._id,
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '07:30 PM',
    endTime: '09:00 PM',
    capacity: 25
  });

  // 4. Instructors
  const inst1 = await Instructor.create({
    name: 'Sensei Kenji Takahashi',
    email: 'kenji@samuraiacademy.com',
    phone: '+1 (555) 301-1122',
    specialization: 'Shotokan Karate 5th Dan • Head Master',
    branch: b1._id
  });
  const inst2 = await Instructor.create({
    name: 'Coach Marcus Silva',
    email: 'marcus@samuraiacademy.com',
    phone: '+1 (555) 301-3344',
    specialization: 'Brazilian Jiu-Jitsu Black Belt • IBJJF Champ',
    branch: b1._id
  });
  const inst3 = await Instructor.create({
    name: 'Master Sarah Vance',
    email: 'sarah@samuraiacademy.com',
    phone: '+1 (555) 301-5566',
    specialization: 'Muay Thai & Kickboxing Champion',
    branch: b1._id
  });

  // 5. Membership Packages
  const pkg1m = await MembershipPackage.create({
    name: '1 Month Standard',
    type: 'monthly',
    durationMonths: 1,
    durationDays: 0,
    classLimit: null,
    feeAmount: 120,
    description: 'Full access to daily classes for 1 month from joining date'
  });
  const pkg3m = await MembershipPackage.create({
    name: '3 Months Quarterly Pro',
    type: 'monthly',
    durationMonths: 3,
    durationDays: 0,
    classLimit: null,
    feeAmount: 320,
    description: 'Best value 3-month package with free uniform patch'
  });
  const pkg6m = await MembershipPackage.create({
    name: '6 Months Half-Year Elite',
    type: 'monthly',
    durationMonths: 6,
    durationDays: 0,
    classLimit: null,
    feeAmount: 580,
    description: '6 months dedicated training with belt progression tests included'
  });
  const pkg12m = await MembershipPackage.create({
    name: '12 Months Annual Warrior',
    type: 'monthly',
    durationMonths: 12,
    durationDays: 0,
    classLimit: null,
    feeAmount: 990,
    description: 'Full year master package with VIP seminar discounts'
  });
  const pkgClass = await MembershipPackage.create({
    name: '10-Class Flex Pass',
    type: 'class_pack',
    durationMonths: 2,
    durationDays: 0,
    classLimit: 10,
    feeAmount: 150,
    description: 'Flexible 10 attendance sessions valid for 60 days'
  });

  // 6. Users: Admin & Staff
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const adminUser = await User.create({
    name: 'Master Takeshi (Admin)',
    email: 'admin@samurai.com',
    password: adminPassword,
    role: 'admin',
    phone: '+1 (555) 999-0001',
    branch: b1._id,
    isActive: true
  });

  const staffUser = await User.create({
    name: 'Elena Rostova (Staff)',
    email: 'staff@samurai.com',
    password: staffPassword,
    role: 'staff',
    phone: '+1 (555) 999-0002',
    branch: b1._id,
    isActive: true
  });

  // 7. Seed Students with realistic membership cycles & expiries
  const now = new Date();

  // Helper date generators
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  const daysFromNow = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  const studentConfigs = [
    {
      code: 'SAM-2026-001',
      name: 'Ryu Hoshi',
      phone: '+1 (555) 101-2001',
      email: 'student@samurai.com', // Demo student login
      gender: 'Male',
      branch: b1._id,
      batch: batch1._id,
      instructor: inst1._id,
      pkg: pkg3m,
      start: daysAgo(45), // Expiring in 45 days
      paid: 320,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-002',
      name: 'Jin Kazama',
      phone: '+1 (555) 101-2002',
      email: 'jin.kazama@example.com',
      gender: 'Male',
      branch: b1._id,
      batch: batch2._id,
      instructor: inst2._id,
      pkg: pkg1m,
      start: daysAgo(29), // Expiring in 1 day (Urgent reminder!)
      paid: 120,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-003',
      name: 'Chun-Li Zhang',
      phone: '+1 (555) 101-2003',
      email: 'chunli@example.com',
      gender: 'Female',
      branch: b1._id,
      batch: batch4._id,
      instructor: inst3._id,
      pkg: pkg1m,
      start: daysAgo(27), // Expiring in 3 days (3-day reminder!)
      paid: 120,
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-004',
      name: 'Ken Masters',
      phone: '+1 (555) 101-2004',
      email: 'ken.masters@example.com',
      gender: 'Male',
      branch: b1._id,
      batch: batch1._id,
      instructor: inst1._id,
      pkg: pkg1m,
      start: daysAgo(23), // Expiring in 7 days (7-day reminder!)
      paid: 120,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-005',
      name: 'Kazuya Mishima',
      phone: '+1 (555) 101-2005',
      email: 'kazuya@example.com',
      gender: 'Male',
      branch: b1._id,
      batch: batch3._id,
      instructor: inst1._id,
      pkg: pkg1m,
      start: daysAgo(35), // Expired 5 days ago!
      paid: 120,
      photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-006',
      name: 'Cammy White',
      phone: '+1 (555) 101-2006',
      email: 'cammy.white@example.com',
      gender: 'Female',
      branch: b1._id,
      batch: batch4._id,
      instructor: inst3._id,
      pkg: pkgClass, // Class Pack (10 classes)
      start: daysAgo(20),
      paid: 150,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      createLogin: true
    },
    {
      code: 'SAM-2026-007',
      name: 'Makoto Nagano',
      phone: '+1 (555) 101-2007',
      email: 'makoto@example.com',
      gender: 'Female',
      branch: b1._id,
      batch: batch1._id,
      instructor: inst1._id,
      pkg: pkg6m,
      start: daysAgo(10), // Fresh active
      paid: 580,
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      createLogin: false
    },
    {
      code: 'SAM-2026-008',
      name: 'Hwoarang Lee',
      phone: '+1 (555) 101-2008',
      email: 'hwoarang@example.com',
      gender: 'Male',
      branch: b1._id,
      batch: batch3._id,
      instructor: inst2._id,
      pkg: pkg3m,
      start: daysAgo(15),
      paid: 200, // Partial payment ($120 balance due)
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      createLogin: false
    },
    {
      code: 'SAM-2026-009',
      name: 'Sakura Kasugano',
      phone: '+1 (555) 101-2009',
      email: 'sakura@example.com',
      gender: 'Female',
      branch: b1._id,
      batch: batch3._id,
      instructor: inst1._id,
      pkg: pkg1m,
      start: daysAgo(30), // Expires Today!
      paid: 120,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createLogin: false
    },
    {
      code: 'SAM-2026-010',
      name: 'Guile William',
      phone: '+1 (555) 101-2010',
      email: 'guile@example.com',
      gender: 'Male',
      branch: b1._id,
      batch: batch4._id,
      instructor: inst3._id,
      pkg: pkg12m,
      start: daysAgo(120),
      paid: 990,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      createLogin: false
    }
  ];

  const createdStudents = [];

  for (const cfg of studentConfigs) {
    const student = await Student.create({
      studentId: cfg.code,
      name: cfg.name,
      art: cfg.art || 'Karate',
      phone: cfg.phone,
      email: cfg.email,
      address: '42 Martial Arts Way, CA',
      gender: cfg.gender,
      joiningDate: cfg.start,
      photo: cfg.photo,
      branch: cfg.branch,
      batch: cfg.batch,
      instructor: cfg.instructor,
      status: 'active'
    });

    // Date-to-date expiry calculation
    const expiry = calculateExpiryDate(cfg.start, cfg.pkg.durationMonths, cfg.pkg.durationDays);
    const balance = Math.max(0, cfg.pkg.feeAmount - cfg.paid);
    const paymentStatus = balance === 0 ? 'paid' : (cfg.paid > 0 ? 'partial' : 'pending');

    let memStatus = 'active';
    const nowTime = now.getTime();
    if (nowTime > expiry.getTime()) {
      memStatus = 'expired';
      student.status = 'inactive';
      await student.save();
    } else {
      const daysLeft = Math.ceil((expiry.getTime() - nowTime) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) memStatus = 'expiring_soon';
    }

    const membership = await StudentMembership.create({
      student: student._id,
      package: cfg.pkg._id,
      packageName: cfg.pkg.name,
      packageAmount: cfg.pkg.feeAmount,
      startDate: cfg.start,
      expiryDate: expiry,
      nextRenewalDate: expiry,
      classLimit: cfg.pkg.classLimit || null,
      attendedClasses: 0,
      remainingClasses: cfg.pkg.classLimit ? cfg.pkg.classLimit : null,
      status: memStatus,
      paymentStatus,
      totalPaid: cfg.paid,
      balanceDue: balance,
      cycleNumber: 1
    });

    student.currentPackage = cfg.pkg._id;
    student.currentMembership = membership._id;
    await student.save();

    // Payment record & receipt
    if (cfg.paid > 0) {
      await Payment.create({
        receiptNumber: generateReceiptNumber(),
        student: student._id,
        membership: membership._id,
        amount: cfg.pkg.feeAmount,
        paidAmount: cfg.paid,
        balance,
        paymentMethod: cfg.paid > 500 ? 'Bank Transfer' : 'Cash',
        paymentDate: cfg.start,
        status: balance === 0 ? 'completed' : 'partial',
        branch: cfg.branch,
        receivedBy: adminUser._id,
        notes: `Initial registration fee for ${cfg.pkg.name}`
      });
    }

    // Portal login user account
    if (cfg.createLogin) {
      const userObj = await User.create({
        name: student.name,
        email: student.email,
        password: studentPassword, // 'student123'
        role: 'student',
        studentId: student._id,
        phone: student.phone,
        branch: cfg.branch,
        isActive: true
      });
      student.userId = userObj._id;
      await student.save();
    }

    createdStudents.push({ student, membership, cfg });
  }

  // 8. Generate 14 days of realistic attendance
  console.log('🥋 [Seed] Generating 14 days of attendance records...');
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);

    for (const item of createdStudents) {
      const { student, membership } = item;
      // Probability of attendance
      const rand = Math.random();
      let status = 'Present';
      if (rand < 0.15) status = 'Absent';
      else if (rand < 0.22) status = 'Leave';

      const record = await Attendance.create({
        student: student._id,
        date: dateStr,
        time: '06:15 PM',
        status,
        branch: student.branch,
        batch: student.batch,
        membershipCycle: membership._id,
        markedBy: staffUser._id,
        remarks: status === 'Leave' ? 'Advance notice provided' : ''
      });

      if (status === 'Present') {
        membership.attendedClasses += 1;
        if (membership.classLimit !== null && membership.remainingClasses !== null) {
          membership.remainingClasses = Math.max(0, membership.remainingClasses - 1);
        }
      }
    }
  }

  // Save updated membership attendance stats
  for (const item of createdStudents) {
    await item.membership.save();
  }

  // 9. Process initial daily reminders
  const { processDailyReminders } = require('../services/reminderService');
  await processDailyReminders();

  console.log('✅ [Seed] Database successfully populated with high-fidelity Dojo data!');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo Credentials:');
  console.log('   Admin:   admin@samurai.com   / admin123');
  console.log('   Staff:   staff@samurai.com   / staff123');
  console.log('   Student: student@samurai.com / student123  (or use ID: SAM-2026-001)');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;

