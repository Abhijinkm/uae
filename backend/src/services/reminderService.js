const { Student, StudentMembership, Reminder, Settings } = require('../models');
const { getDaysUntilExpiry, formatDate } = require('../utils/dateUtils');

/**
 * Fetch current academy settings or defaults
 */
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

/**
 * Build reminder message using template placeholders
 */
function buildMessage(template, { studentName, packageName, expiryDate, amountDue, academyName, currency = 'AED' }) {
  if (!template) return '';
  return template
    .replace(/{student_name}/g, studentName || 'Student')
    .replace(/{package_name}/g, packageName || 'Membership')
    .replace(/{expiry_date}/g, expiryDate || '')
    .replace(/{amount_due}/g, amountDue ? `${currency} ${amountDue}` : `${currency} 0`)
    .replace(/{academy_name}/g, academyName || 'Samurai Martial Arts');
}

/**
 * Generate WhatsApp direct chat link with prefilled text
 */
function generateWhatsAppLink(phone, message, countryCode = '+1') {
  if (!phone) return null;
  // Clean phone numbers: remove dashes, spaces, brackets
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    const code = countryCode.replace('+', '');
    cleanPhone = `${code}${cleanPhone}`;
  } else {
    cleanPhone = cleanPhone.replace('+', '');
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Scans active and expiring memberships to generate reminders
 */
async function processDailyReminders() {
  const settings = await getSettings();
  const templates = settings.reminderTemplates || {};
  const academyName = settings.academyName || 'Samurai Academy';

  const memberships = await StudentMembership.find({
    status: { $in: ['active', 'expiring_soon', 'expired'] }
  }).populate('student');

  const createdReminders = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const mem of memberships) {
    if (!mem.student) continue;

    const daysLeft = getDaysUntilExpiry(mem.expiryDate);
    let reminderType = null;
    let template = '';

    if (daysLeft === 7) {
      reminderType = '7_days_before';
      template = templates.upcoming7;
    } else if (daysLeft === 3) {
      reminderType = '3_days_before';
      template = templates.upcoming3;
    } else if (daysLeft === 1) {
      reminderType = '1_day_before';
      template = templates.upcoming1;
    } else if (daysLeft === 0) {
      reminderType = 'on_expiry';
      template = templates.onExpiry;
    } else if (daysLeft < 0 && mem.status === 'expired') {
      reminderType = 'expired';
      template = templates.expired;
    }

    if (!reminderType || !template) continue;

    // Check if reminder for this type was already generated today for this student
    const existing = await Reminder.findOne({
      student: mem.student._id,
      membership: mem._id,
      type: reminderType,
      scheduledDate: { $gte: new Date(todayStr) }
    });

    if (!existing) {
      const message = buildMessage(template, {
        studentName: mem.student.name,
        packageName: mem.packageName,
        expiryDate: formatDate(mem.expiryDate),
        amountDue: mem.balanceDue > 0 ? mem.balanceDue : mem.packageAmount,
        academyName
      });

      const reminder = await Reminder.create({
        student: mem.student._id,
        membership: mem._id,
        type: reminderType,
        channel: 'in_app',
        message,
        status: 'sent',
        scheduledDate: new Date()
      });

      createdReminders.push(reminder);
    }
  }

  console.log(`[Reminder Service] Daily processing complete. Created ${createdReminders.length} reminder notifications.`);
  return createdReminders;
}

/**
 * Get active renewal notifications list for dashboard & reminders tab
 */
async function getUpcomingRenewalsList() {
  const settings = await getSettings();
  const templates = settings.reminderTemplates || {};
  const academyName = settings.academyName || 'Samurai Academy';

  // Find all active or expiring memberships
  const memberships = await StudentMembership.find({
    status: { $in: ['active', 'expiring_soon', 'expired'] }
  }).populate('student');

  const items = [];

  for (const mem of memberships) {
    if (!mem.student) continue;

    const daysLeft = getDaysUntilExpiry(mem.expiryDate);

    // Only include if expired or expiring within 14 days
    if (daysLeft > 14 && mem.status !== 'expired') continue;

    let tier = 'normal';
    let template = templates.upcoming7;
    let label = `${daysLeft} days remaining`;

    if (daysLeft < 0 || mem.status === 'expired') {
      tier = 'expired';
      template = templates.expired;
      label = `Expired (${Math.abs(daysLeft)} days ago)`;
    } else if (daysLeft === 0) {
      tier = 'due_today';
      template = templates.onExpiry;
      label = 'Expires Today';
    } else if (daysLeft <= 1) {
      tier = 'urgent_1d';
      template = templates.upcoming1;
      label = '1 Day Left (Urgent)';
    } else if (daysLeft <= 3) {
      tier = 'warning_3d';
      template = templates.upcoming3;
      label = '3 Days Left';
    } else if (daysLeft <= 7) {
      tier = 'notice_7d';
      template = templates.upcoming7;
      label = '7 Days Left';
    }

    const message = buildMessage(template, {
      studentName: mem.student.name,
      packageName: mem.packageName,
      expiryDate: formatDate(mem.expiryDate),
      amountDue: mem.balanceDue > 0 ? mem.balanceDue : mem.packageAmount,
      academyName
    });

    const whatsappUrl = generateWhatsAppLink(
      mem.student.phone,
      message,
      settings.whatsappCountryCode || '+1'
    );

    items.push({
      membershipId: mem._id,
      studentId: mem.student._id,
      studentCode: mem.student.studentId,
      studentName: mem.student.name,
      studentPhone: mem.student.phone,
      studentPhoto: mem.student.photo,
      packageName: mem.packageName,
      packageAmount: mem.packageAmount,
      balanceDue: mem.balanceDue,
      expiryDate: mem.expiryDate,
      daysLeft,
      tier,
      label,
      status: mem.status,
      message,
      whatsappUrl
    });
  }

  // Sort by urgency: expired and due today first, then closest expiry
  items.sort((a, b) => a.daysLeft - b.daysLeft);
  return items;
}

module.exports = {
  getSettings,
  buildMessage,
  generateWhatsAppLink,
  processDailyReminders,
  getUpcomingRenewalsList
};

