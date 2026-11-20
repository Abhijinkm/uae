const { Reminder, Student, StudentMembership, AuditLog } = require('../models');
const { getUpcomingRenewalsList, processDailyReminders, getSettings, generateWhatsAppLink, buildMessage } = require('../services/reminderService');
const { formatDate } = require('../utils/dateUtils');

// @desc    Get upcoming renewals list with status, days left & WhatsApp links
// @route   GET /api/reminders/upcoming
// @access  Private
async function getUpcomingRenewals(req, res) {
  try {
    const list = await getUpcomingRenewalsList();

    // Grouping summary
    const counts = {
      expired: list.filter(item => item.tier === 'expired').length,
      dueToday: list.filter(item => item.tier === 'due_today').length,
      urgent1d: list.filter(item => item.tier === 'urgent_1d').length,
      warning3d: list.filter(item => item.tier === 'warning_3d').length,
      notice7d: list.filter(item => item.tier === 'notice_7d').length,
      total: list.length
    };

    res.json({
      success: true,
      counts,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Send / Log a manual reminder to a student (WhatsApp, SMS, or In-App)
// @route   POST /api/reminders/send
// @access  Private
async function sendManualReminder(req, res) {
  try {
    const { studentId, membershipId, channel = 'whatsapp', customMessage } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let membership = null;
    if (membershipId) {
      membership = await StudentMembership.findById(membershipId);
    } else if (student.currentMembership) {
      membership = await StudentMembership.findById(student.currentMembership);
    }

    const settings = await getSettings();
    const finalMessage = customMessage || buildMessage(settings.reminderTemplates.upcoming3, {
      studentName: student.name,
      packageName: membership ? membership.packageName : 'Membership',
      expiryDate: membership ? formatDate(membership.expiryDate) : 'Soon',
      amountDue: membership ? (membership.balanceDue > 0 ? membership.balanceDue : membership.packageAmount) : 0,
      academyName: settings.academyName
    });

    const reminder = await Reminder.create({
      student: student._id,
      membership: membership ? membership._id : null,
      type: '1_day_before',
      channel,
      message: finalMessage,
      status: 'sent',
      sentAt: new Date()
    });

    let actionUrl = null;
    if (channel === 'whatsapp') {
      actionUrl = generateWhatsAppLink(student.phone, finalMessage, settings.whatsappCountryCode || '+1');
    }

    await AuditLog.create({
      action: 'SEND_REMINDER',
      performedBy: req.user ? req.user._id : null,
      targetId: String(reminder._id),
      targetType: 'Reminder',
      details: {
        studentId: student.studentId,
        studentName: student.name,
        channel,
        phone: student.phone
      }
    });

    res.json({
      success: true,
      message: `Reminder recorded for ${student.name} via ${channel.toUpperCase()}`,
      data: reminder,
      actionUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Trigger automated daily reminder processing manually
// @route   POST /api/reminders/run-cron
// @access  Private (Admin)
async function triggerDailyReminderSweep(req, res) {
  try {
    const results = await processDailyReminders();
    res.json({
      success: true,
      message: `Daily reminder sweep executed. ${results.length} reminder notifications generated.`,
      count: results.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// @desc    Get reminder logs/history
// @route   GET /api/reminders/logs
// @access  Private
async function getReminderLogs(req, res) {
  try {
    const reminders = await Reminder.find()
      .populate('student', 'name studentId phone photo')
      .populate('membership', 'packageName expiryDate')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getUpcomingRenewals,
  sendManualReminder,
  triggerDailyReminderSweep,
  getReminderLogs
};

