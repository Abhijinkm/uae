const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('samurai_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('samurai_token');
      localStorage.removeItem('samurai_user');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (emailOrId, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrId, password })
    }),
  getMe: () => request('/auth/me'),
  registerStaff: (data) =>
    request('/auth/register-staff', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Students
  getStudents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/students${query ? `?${query}` : ''}`);
  },
  getStudentById: (id) => request(`/students/${id}`),
  createStudent: (studentData) =>
    request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    }),
  updateStudent: (id, studentData) =>
    request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData)
    }),
  toggleStudentStatus: (id, status) =>
    request(`/students/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  deleteStudent: (id) =>
    request(`/students/${id}`, {
      method: 'DELETE'
    }),

  // Attendance
  getDailyAttendance: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance${query ? `?${query}` : ''}`);
  },
  markAttendance: (records, date) =>
    request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ records, date })
    }),
  getStudentAttendanceHistory: (studentId) =>
    request(`/attendance/student/${studentId}`),

  // Memberships
  getPackages: () => request('/memberships/packages'),
  createPackage: (data) =>
    request('/memberships/packages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePackage: (id, data) =>
    request(`/memberships/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePackage: (id) =>
    request(`/memberships/packages/${id}`, {
      method: 'DELETE'
    }),
  calculateDates: (startDate, durationMonths, durationDays) =>
    request('/memberships/calculate-dates', {
      method: 'POST',
      body: JSON.stringify({ startDate, durationMonths, durationDays })
    }),
  renewMembership: (data) =>
    request('/memberships/renew', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Payments
  recordPayment: (paymentData) =>
    request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }),
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  getPaymentReceipt: (id) => request(`/payments/${id}/receipt`),

  // Reminders
  getUpcomingRenewals: () => request('/reminders/upcoming'),
  sendManualReminder: (data) =>
    request('/reminders/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  triggerDailyReminderSweep: () =>
    request('/reminders/run-cron', {
      method: 'POST'
    }),
  getReminderLogs: () => request('/reminders/logs'),

  // Reports
  getDailyAttendanceReport: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/daily-attendance?${q}`);
  },
  getMonthlyFeeReport: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/monthly-fees?${q}`);
  },
  getPendingFeeReport: () => request('/reports/pending-fees'),
  getExpiredMembershipsReport: () => request('/reports/expired-memberships'),
  getBranchPerformanceReport: () => request('/reports/branch-performance'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getBranches: () => request('/settings/branches'),
  createBranch: (data) =>
    request('/settings/branches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBranch: (id, data) =>
    request(`/settings/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteBranch: (id) =>
    request(`/settings/branches/${id}`, {
      method: 'DELETE'
    }),
  getBatches: () => request('/settings/batches'),
  createBatch: (data) =>
    request('/settings/batches', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateBatch: (id, data) =>
    request(`/settings/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteBatch: (id) =>
    request(`/settings/batches/${id}`, {
      method: 'DELETE'
    }),
  getInstructors: () => request('/settings/instructors'),
  createInstructor: (data) =>
    request('/settings/instructors', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateInstructor: (id, data) =>
    request(`/settings/instructors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getAuditLogs: () => request('/settings/audit-logs'),
  getStaffUsers: () => request('/settings/staff')
};

