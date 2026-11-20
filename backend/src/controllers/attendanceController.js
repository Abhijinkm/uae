const { Attendance, Student, StudentMembership, Batch, Branch, AuditLog } = require('../models');
const { recalculateAttendanceForMembership } = require('../services/membershipService');
const { formatDate } = require('../utils/dateUtils');

// @desc    Get attendance sheet for a specific date and filters
// @route   GET /api/attendance
// @access  Private
async function getDailyAttendance(req, res) {
  try {
    const { date, branch, batch, search } = req.query;
    const targetDate = date ? formatDate(new Date(date)) : formatDate(new Date());

    // 1. Find all active students matching branch/batch/search
    const studentFilter = { status: 'active' };
    if (branch) studentFilter.branch = branch;
    if (batch) studentFilter.batch = batch;

    if (search && search.trim()) {
      const q = search.trim();
      studentFilter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } }
      ];
    }

    const students = await Student.find(studentFilter)
      .populate('branch', 'name code')
      .populate('batch', 'name startTime endTime')
      .populate('currentPackage', 'name classLimit')
      .populate('currentMembership')
      .sort({ name: 1 });

    // 2. Find attendance records already marked for this date
    const markedRecords = await Attendance.find({ date: targetDate });
    const markedMap = {};
    markedRecords.forEach(rec => {
      markedMap[String(rec.student)] = rec;
    });

    // 3. Combine into a comprehensive daily register list
    const register = students.map(st => {
      const existing = markedMap[String(st._id)];
      const membership = st.currentMembership;

      return {
        studentId: st._id,
        studentCode: st.studentId,
        name: st.name,
        photo: st.photo,
        branch: st.branch,
        batch: st.batch,
        packageName: membership ? membership.packageName : (st.currentPackage ? st.currentPackage.name : 'None'),
        membershipStatus: membership ? membership.status : 'None',
        classLimit: membership ? membership.classLimit : null,
        attendedClasses: membership ? membership.attendedClasses : 0,
        remainingClasses: membership ? membership.remainingClasses : null,
        attendanceId: existing ? existing._id : null,
        status: existing ? existing.status : null, // null means not yet marked
        time: existing ? existing.time : '',
        remarks: existing ? existing.remarks : ''
      };
    });

    // Compute stats for this date
    const totalMarked = Object.keys(markedMap).length;
    const presentCount = markedRecords.filter(r => r.status === 'Present').length;
    const absentCount = markedRecords.filter(r => r.status === 'Absent').length;
    const leaveCount = markedRecords.filter(r => r.status === 'Leave').length;

    res.json({
      success: true,
      date: targetDate,
      stats: {
        totalEligible: students.length,
        totalMarked,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
        unmarked: Math.max(0, students.length - totalMarked)
      },
      data: register
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Mark attendance for single or multiple students
// @route   POST /api/attendance/mark
// @access  Private
async function markAttendance(req, res) {
  try {
    const { records, date } = req.body;
    // records: [{ studentId, status: 'Present'|'Absent'|'Leave', time, remarks }]

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance records provided' });
    }

    const targetDate = date ? formatDate(new Date(date)) : formatDate(new Date());
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const updatedOrCreated = [];

    for (const item of records) {
      if (!item.studentId || !item.status) continue;

      const student = await Student.findById(item.studentId);
      if (!student) continue;

      const recordData = {
        student: student._id,
        date: targetDate,
        time: item.time || currentTime,
        status: item.status,
        branch: student.branch,
        batch: student.batch,
        membershipCycle: student.currentMembership || null,
        markedBy: req.user ? req.user._id : null,
        remarks: item.remarks || ''
      };

      // Upsert: check if attendance already marked for this student on this date
      let existing = await Attendance.findOne({
        student: student._id,
        date: targetDate
      });

      if (existing) {
        existing.status = item.status;
        existing.time = item.time || existing.time;
        existing.remarks = item.remarks !== undefined ? item.remarks : existing.remarks;
        existing.markedBy = req.user ? req.user._id : null;
        await existing.save();
        updatedOrCreated.push(existing);
      } else {
        const created = await Attendance.create(recordData);
        updatedOrCreated.push(created);
      }

      // Automatically recalculate student's membership attendance count & remaining classes!
      if (student.currentMembership) {
        const memId = student.currentMembership._id || student.currentMembership;
        await recalculateAttendanceForMembership(student._id, memId);
      }
    }

    await AuditLog.create({
      action: 'MARK_ATTENDANCE',
      performedBy: req.user ? req.user._id : null,
      targetType: 'Attendance',
      details: {
        date: targetDate,
        count: updatedOrCreated.length
      }
    });

    res.json({
      success: true,
      message: `Successfully recorded attendance for ${updatedOrCreated.length} student(s)`,
      count: updatedOrCreated.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get attendance history and breakdown for a student
// @route   GET /api/attendance/student/:id
// @access  Private
async function getStudentAttendanceHistory(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const records = await Attendance.find({ student: student._id })
      .populate('branch', 'name')
      .populate('batch', 'name')
      .sort({ date: -1 });

    const totalPresent = records.filter(r => r.status === 'Present').length;
    const totalAbsent = records.filter(r => r.status === 'Absent').length;
    const totalLeave = records.filter(r => r.status === 'Leave').length;

    res.json({
      success: true,
      stats: {
        totalRecords: records.length,
        totalPresent,
        totalAbsent,
        totalLeave,
        percentage: records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0
      },
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getDailyAttendance,
  markAttendance,
  getStudentAttendanceHistory
};

