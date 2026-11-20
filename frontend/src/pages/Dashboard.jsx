import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  CalendarCheck,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  MessageSquare,
  TrendingUp,
  Receipt,
  UserMinus,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import ReminderModal from '../components/ReminderModal';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const { isDark } = useTheme();

  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-samurai-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const upcomingRenewals = data?.upcomingRenewals || [];
  const todayRecords = data?.todayRecords || [];

  const PIE_COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-samurai-900 via-dojo-900 to-black p-6 lg:p-8 text-white border border-samurai-800/40 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-samurai-600/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              Operational Overview
            </div>
            <h2 className="text-2xl lg:text-3xl font-black font-cinzel tracking-wide">
              Samurai Martial Arts Command Center
            </h2>
            <p className="text-sm text-gray-300 mt-1 max-w-xl">
              Track real-time student attendance, date-to-date memberships, automated fee reminders, and revenue trends.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/attendance"
              className="px-4 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-lg shadow-samurai-600/30 transition-all flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              Mark Attendance
            </Link>
            <Link
              to="/students"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/10 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          icon={Users}
          color="blue"
          subtitle={`${stats.activeStudents || 0} Active • ${stats.inactiveStudents || 0} Inactive`}
        />

        <StatCard
          title="Today's Attendance"
          value={`${stats.todayAttendance?.present || 0} Present`}
          icon={CalendarCheck}
          color="emerald"
          subtitle={`${stats.todayAttendance?.absent || 0} Absent • ${stats.todayAttendance?.leave || 0} Leave`}
        />

        <StatCard
          title="Fees Collected (Month)"
          value={`${(stats.feesCollectedThisMonth || 0).toLocaleString()} AED`}
          icon={DollarSign}
          color="samurai"
          subtitle={`All-Time: ${(stats.totalAllTimeRevenue || 0).toLocaleString()} AED`}
        />

        <StatCard
          title="Pending Fees"
          value={`${(stats.pendingFees || 0).toLocaleString()} AED`}
          icon={AlertTriangle}
          color="amber"
          subtitle={`${stats.upcomingRenewalsCount || 0} Upcoming Renewals`}
        />
      </div>

      {/* Charts Section: Attendance & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Attendance Trends (Last 7 Days)
              </h3>
              <p className="text-xs text-gray-400">Daily present, absent and leave distribution</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              Daily Log
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.attendanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262b36' : '#f0f0f0'} />
                <XAxis dataKey="dayName" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} />
                <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#181b22' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '12px',
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" name="Leave" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Package Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Package Popularity
            </h3>
            <p className="text-xs text-gray-400">Active membership plan distribution</p>
          </div>

          <div className="h-60 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.packageDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(charts.packageDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#181b22' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {(charts.packageDistribution || []).map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  <span className="truncate max-w-[150px]">{item.name}</span>
                </span>
                <span className="font-bold text-gray-900 dark:text-white">{item.count} students</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend Area Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Monthly Fee Revenue Trend (Last 6 Months)
            </h3>
            <p className="text-xs text-gray-400">Actual collections across cash, bank, and online payments</p>
          </div>
          <Link
            to="/payments"
            className="text-xs font-bold text-samurai-600 dark:text-samurai-400 hover:underline flex items-center gap-1"
          >
            View All Payments
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.revenueTrend || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262b36' : '#f0f0f0'} />
              <XAxis dataKey="month" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} />
              <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={12} tickFormatter={(v) => `${v} AED`} />
              <Tooltip
                formatter={(val) => [`${val.toLocaleString()} AED`, 'Revenue']}
                contentStyle={{
                  backgroundColor: isDark ? '#181b22' : '#ffffff',
                  borderColor: isDark ? '#374151' : '#e5e7eb',
                  borderRadius: '12px'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout: Urgent Renewal Alerts & Today's Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Renewal Reminders */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Upcoming Fee Renewals
                </h3>
                <p className="text-xs text-gray-400">Date-to-date expiry alerts needing action</p>
              </div>
            </div>
            <Link
              to="/reminders"
              className="text-xs font-bold text-samurai-600 dark:text-samurai-400 hover:underline flex items-center gap-1"
            >
              See All ({stats.upcomingRenewalsCount || 0})
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No urgent fee renewals pending.</p>
            ) : (
              upcomingRenewals.map((item) => (
                <div
                  key={item.membershipId}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-100 dark:border-gray-800 hover:border-samurai-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-samurai-600/10 text-samurai-600 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                      {item.studentPhoto ? (
                        <img src={item.studentPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        item.studentName?.charAt(0) || 'S'
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {item.studentName}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {item.studentCode} • {item.packageName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        item.tier === 'expired'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : item.tier === 'urgent_1d' || item.tier === 'due_today'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}
                    >
                      {item.label}
                    </span>

                    <button
                      onClick={() => setSelectedReminder(item)}
                      title="Send WhatsApp Reminder"
                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Attendance Live Feed */}
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Today's Attendance Register
                </h3>
                <p className="text-xs text-gray-400">Latest class check-ins</p>
              </div>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-bold text-samurai-600 dark:text-samurai-400 hover:underline flex items-center gap-1"
            >
              Full Register
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {todayRecords.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No attendance marked yet today.</p>
            ) : (
              todayRecords.map((r) => (
                <div
                  key={r._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-dojo-800 flex items-center justify-center font-bold text-xs text-gray-700 dark:text-gray-300">
                      {r.student?.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {r.student?.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {r.student?.studentId} • {r.time || 'Class Check-in'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={r.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reminder Action Modal */}
      {selectedReminder && (
        <ReminderModal
          isOpen={!!selectedReminder}
          onClose={() => setSelectedReminder(null)}
          reminderItem={selectedReminder}
          onSuccess={fetchStats}
        />
      )}
    </div>
  );
}

