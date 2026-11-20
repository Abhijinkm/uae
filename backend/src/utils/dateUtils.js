/**
 * Date Utility Functions for Date-to-Date Membership & Attendance
 */

/**
 * Calculates membership expiry date based on start date and package duration
 * e.g., Joining Nov 19 + 1 Month = Dec 19
 * @param {Date|string} startDate 
 * @param {number} durationMonths 
 * @param {number} [durationDays=0] 
 * @returns {Date} expiryDate
 */
function calculateExpiryDate(startDate, durationMonths = 1, durationDays = 0) {
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date');
  }

  const result = new Date(start);

  if (durationMonths && durationMonths > 0) {
    const currentMonth = result.getMonth();
    const currentDay = result.getDate();
    result.setMonth(currentMonth + Number(durationMonths));

    // Handle end-of-month overflow (e.g. Jan 31 + 1 month -> Feb 28/29)
    if (result.getDate() !== currentDay) {
      result.setDate(0); // set to last day of previous month
    }
  }

  if (durationDays && durationDays > 0) {
    result.setDate(result.getDate() + Number(durationDays));
  }

  // Set time to end of day 23:59:59.999
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Normalizes a date to start of day (00:00:00.000)
 */
function toStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Normalizes a date to end of day (23:59:59.999)
 */
function toEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Formats a Date to YYYY-MM-DD string
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Calculates days remaining until expiry
 * Negative if already expired
 */
function getDaysUntilExpiry(expiryDate) {
  const now = new Date();
  const end = new Date(expiryDate);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine membership status based on dates and class usage
 */
function getMembershipStatus(expiryDate, classLimit = null, attendedClasses = 0) {
  const daysLeft = getDaysUntilExpiry(expiryDate);

  if (classLimit !== null && classLimit > 0 && attendedClasses >= classLimit) {
    return 'expired'; // all classes exhausted
  }

  if (daysLeft < 0) {
    return 'expired';
  } else if (daysLeft <= 7) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
}

module.exports = {
  calculateExpiryDate,
  toStartOfDay,
  toEndOfDay,
  formatDate,
  getDaysUntilExpiry,
  getMembershipStatus
};

