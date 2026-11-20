const bcrypt = require('bcryptjs');
const { Student, User, StudentMembership, Attendance, Payment, Branch, Batch, Instructor, MembershipPackage, AuditLog } = require('../models');
const { createMembershipForStudent, recalculateAttendanceForMembership } = require('../services/membershipService');
const { formatDate } = require('../utils/dateUtils');

/**
 * Generate sequential unique student ID e.g. SAM-2026-001
 */
async function generateStudentId() {
  const currentYear = new Date().getFullYear();
  const count = await Student.countDocuments();
  const sequence = String(count + 1).padStart(3, '0');
  const studentId = `SAM-${currentYear}-${sequence}`;

  // Ensure uniqueness
  const existing = await Student.findOne({ studentId });
  if (existing) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SAM-${currentYear}-${randomSuffix}`;
  }
  return studentId;
}

// @desc    Get all students with filters & search
// @route   GET /api/students
// @access  Private
async function getStudents(req, res) {
  try {
    const { search, branch, batch, status, packageId, art } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (batch) filter.batch = batch;
    if (status) filter.status = status;
    if (packageId) filter.currentPackage = packageId;
    if (art) filter.art = art;

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { art: { $regex: q, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('branch', 'name code')
      .populate('batch', 'name startTime endTime')
      .populate('instructor', 'name specialization')
      .populate('currentPackage', 'name feeAmount durationMonths classLimit')
      .populate('currentMembership')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get single student details with complete history
// @route   GET /api/students/:id
// @access  Private
async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id)
      .populate('branch')
      .populate('batch')
      .populate('instructor')
      .populate('currentPackage')
      .populate('currentMembership');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Refresh attendance count for current membership if active
    if (student.currentMembership) {
      const memId = student.currentMembership._id || student.currentMembership;
      await recalculateAttendanceForMembership(student._id, memId);
    }

    // Fetch complete history
    const membershipHistory = await StudentMembership.find({ student: student._id })
      .populate('package')
      .sort({ cycleNumber: -1 });

    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate('branch', 'name')
      .populate('batch', 'name')
      .sort({ date: -1 });

    const paymentRecords = await Payment.find({ student: student._id })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

    // Compute overall stats
    const totalPresent = attendanceRecords.filter(a => a.status === 'Present').length;
    const totalAbsent = attendanceRecords.filter(a => a.status === 'Absent').length;
    const totalLeave = attendanceRecords.filter(a => a.status === 'Leave').length;
    const attendancePercentage = attendanceRecords.length > 0
      ? Math.round((totalPresent / attendanceRecords.length) * 100)
      : 0;

    let totalPaidAllTime = 0;
    paymentRecords.forEach(p => {
      totalPaidAllTime += Number(p.paidAmount) || 0;
    });

    res.json({
      success: true,
      data: {
        student,
        membershipHistory,
        attendanceRecords,
        paymentRecords,
        stats: {
          totalClassesRecorded: attendanceRecords.length,
          totalPresent,
          totalAbsent,
          totalLeave,
          attendancePercentage,
          totalPaidAllTime
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Register a new student
// @route   POST /api/students
// @access  Private
async function createStudent(req, res) {
  try {
    const {
      name,
      art,
      phone,
      email,
      address,
      gender,
      dateOfBirth,
      joiningDate,
      admissionDate,
      photo,
      branch,
      batch,
      instructor,
      packageId,
      initialPayment,
      paymentMethod = 'Cash',
      transactionReference = '',
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      createPortalLogin = true,
      portalPassword = ''
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Student Name and Phone number are required' });
    }

    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email ? email.toLowerCase().trim() : '';
    const studentStartDate = admissionDate ? new Date(admissionDate) : (joiningDate ? new Date(joiningDate) : new Date());

    // Auto-resolve branch if not provided (single branch mode)
    let targetBranch = branch;
    if (!targetBranch) {
      const firstBranch = await Branch.findOne();
      targetBranch = firstBranch ? firstBranch._id : null;
    }

    // Auto-resolve batch if not provided
    let targetBatch = batch;
    if (!targetBatch) {
      const firstBatch = await Batch.findOne();
      targetBatch = firstBatch ? firstBatch._id : null;
    }

    // Auto-resolve instructor if not provided
    let targetInstructor = instructor;
    if (!targetInstructor) {
      const firstInst = await Instructor.findOne();
      targetInstructor = firstInst ? firstInst._id : null;
    }

    // Check if this exact student already exists (same name & phone)
    let existingStudent = await Student.findOne({
      phone: trimmedPhone,
      name: { $regex: `^${trimmedName}$`, $options: 'i' }
    });

    if (existingStudent) {
      // Re-register / Update existing student record with new package & admission date
      const updateData = {
        name: trimmedName,
        art: art ? art.trim() : (existingStudent.art || 'Karate'),
        gender: gender || existingStudent.gender || 'Male',
        email: trimmedEmail || existingStudent.email,
        joiningDate: studentStartDate,
        status: 'active'
      };
      if (branch) updateData.branch = branch;
      if (batch) updateData.batch = batch;

      await Student.findByIdAndUpdate(existingStudent._id, updateData);

      let membershipResult = null;
      if (packageId) {
        let paidAmt = initialPayment !== undefined && initialPayment !== '' ? Number(initialPayment) : null;
        if (paidAmt === null) {
          const pkgObj = await MembershipPackage.findById(packageId);
          paidAmt = pkgObj ? Number(pkgObj.feeAmount) : 0;
        }

        membershipResult = await createMembershipForStudent({
          studentId: existingStudent._id,
          packageId,
          startDate: studentStartDate,
          totalPaid: paidAmt,
          paymentMethod: paymentMethod || 'Cash',
          transactionReference: transactionReference || '',
          receivedBy: req.user ? req.user._id : null,
          branchId: existingStudent.branch || targetBranch,
          notes: `Updated membership cycle - ${updateData.art}`
        });
      }

      const populated = await Student.findById(existingStudent._id)
        .populate('branch')
        .populate('batch')
        .populate('instructor')
        .populate('currentPackage')
        .populate('currentMembership');

      return res.status(200).json({
        success: true,
        message: `Student ${existingStudent.name} (${existingStudent.studentId}) updated successfully with new admission date and package`,
        data: populated,
        membership: membershipResult ? membershipResult.membership : null,
        payment: membershipResult ? membershipResult.payment : null
      });
    }

    const studentId = await generateStudentId();

    const studentData = {
      studentId,
      name: trimmedName,
      art: art ? art.trim() : 'Karate',
      phone: trimmedPhone,
      email: trimmedEmail,
      address: address ? address.trim() : '',
      gender: gender || 'Male',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      joiningDate: studentStartDate,
      photo: photo || '',
      branch: targetBranch,
      batch: targetBatch,
      instructor: targetInstructor,
      status: 'active',
      emergencyContact: {
        name: emergencyName || '',
        phone: emergencyPhone || '',
        relation: emergencyRelation || ''
      }
    };

    const newStudent = await Student.create(studentData);

    // If package selected, create initial membership with Date-to-Date calculation
    let membershipResult = null;
    if (packageId) {
      let paidAmt = initialPayment !== undefined && initialPayment !== '' ? Number(initialPayment) : null;
      if (paidAmt === null) {
        const pkgObj = await MembershipPackage.findById(packageId);
        paidAmt = pkgObj ? Number(pkgObj.feeAmount) : 0;
      }

      membershipResult = await createMembershipForStudent({
        studentId: newStudent._id,
        packageId,
        startDate: studentData.joiningDate,
        totalPaid: paidAmt,
        paymentMethod: paymentMethod || 'Cash',
        transactionReference: transactionReference || '',
        receivedBy: req.user ? req.user._id : null,
        branchId: targetBranch,
        notes: `Initial registration package - ${studentData.art}`
      });
    }

    // Optionally create student portal login account
    let createdUser = null;
    if (createPortalLogin) {
      const userEmail = email ? email.toLowerCase().trim() : `${studentId.toLowerCase()}@samurai.local`;
      const plainPassword = portalPassword || phone.trim(); // default to phone or custom password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      // Check if user already exists
      let existingUser = await User.findOne({ email: userEmail });
      if (!existingUser) {
        createdUser = await User.create({
          name: newStudent.name,
          email: userEmail,
          password: hashedPassword,
          role: 'student',
          studentId: newStudent._id,
          phone: newStudent.phone,
          branch: branch || null,
          isActive: true
        });

        await Student.findByIdAndUpdate(newStudent._id, { userId: createdUser._id });
      } else {
        await Student.findByIdAndUpdate(newStudent._id, { userId: existingUser._id });
      }
    }

    await AuditLog.create({
      action: 'REGISTER_STUDENT',
      performedBy: req.user ? req.user._id : null,
      targetId: String(newStudent._id),
      targetType: 'Student',
      details: {
        studentId,
        name: newStudent.name,
        packageId,
        initialPayment
      }
    });

    const populatedStudent = await Student.findById(newStudent._id)
      .populate('branch')
      .populate('batch')
      .populate('instructor')
      .populate('currentPackage')
      .populate('currentMembership');

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: populatedStudent,
      membership: membershipResult ? membershipResult.membership : null,
      payment: membershipResult ? membershipResult.payment : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private
async function updateStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updates = { ...req.body };
    // Prevent changing unique studentId
    delete updates.studentId;

    if (updates.admissionDate) {
      updates.joiningDate = new Date(updates.admissionDate);
      delete updates.admissionDate;
    }

    if (updates.emergencyName || updates.emergencyPhone || updates.emergencyRelation) {
      updates.emergencyContact = {
        name: updates.emergencyName !== undefined ? updates.emergencyName : (student.emergencyContact ? student.emergencyContact.name : ''),
        phone: updates.emergencyPhone !== undefined ? updates.emergencyPhone : (student.emergencyContact ? student.emergencyContact.phone : ''),
        relation: updates.emergencyRelation !== undefined ? updates.emergencyRelation : (student.emergencyContact ? student.emergencyContact.relation : '')
      };
      delete updates.emergencyName;
      delete updates.emergencyPhone;
      delete updates.emergencyRelation;
    }

    await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    const updated = await Student.findById(req.params.id)
      .populate('branch')
      .populate('batch')
      .populate('instructor')
      .populate('currentPackage')
      .populate('currentMembership');

    await AuditLog.create({
      action: 'UPDATE_STUDENT',
      performedBy: req.user ? req.user._id : null,
      targetId: String(student._id),
      targetType: 'Student',
      details: { studentId: student.studentId, fields: Object.keys(updates) }
    });

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Toggle student active/inactive status
// @route   PATCH /api/students/:id/status
// @access  Private
async function toggleStudentStatus(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const newStatus = req.body.status || (student.status === 'active' ? 'inactive' : 'active');
    student.status = newStatus;
    await student.save();

    // Also toggle linked user account if exists
    if (student.userId) {
      await User.findByIdAndUpdate(student.userId, { isActive: newStatus === 'active' });
    }

    await AuditLog.create({
      action: newStatus === 'active' ? 'REACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT',
      performedBy: req.user ? req.user._id : null,
      targetId: String(student._id),
      targetType: 'Student',
      details: { studentId: student.studentId, newStatus }
    });

    res.json({
      success: true,
      message: `Student account ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      data: student
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Delete student record
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
async function deleteStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Clean up related user login
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }

    await Student.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'DELETE_STUDENT',
      performedBy: req.user ? req.user._id : null,
      targetId: String(req.params.id),
      targetType: 'Student',
      details: { studentId: student.studentId, name: student.name }
    });

    res.json({
      success: true,
      message: 'Student record deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  deleteStudent
};

