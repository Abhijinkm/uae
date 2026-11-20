import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Check,
  AlertCircle,
  Award,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [search, setSearch] = useState('');

  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);

  const [attendanceSheet, setAttendanceSheet] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Local attendance state before saving: map of studentId -> { status, time, remarks, changed }
  const [localMarks, setLocalMarks] = useState({});

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.getDailyAttendance({
        date: selectedDate,
        branch: selectedBranch || undefined,
        batch: selectedBatch || undefined,
        search: search || undefined
      });

      if (res.success) {
        setAttendanceSheet(res.data);
        setStats(res.stats || {});

        // Prepopulate localMarks from existing records
        const initialMarks = {};
        res.data.forEach((item) => {
          initialMarks[item.studentId] = {
            status: item.status || 'Present', // default to Present if not marked
            time: item.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            remarks: item.remarks || '',
            changed: false
          };
        });
        setLocalMarks(initialMarks);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getBranches().then(res => res.success && setBranches(res.data)).catch(() => {});
    api.getBatches().then(res => res.success && setBatches(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedBranch, selectedBatch]);

  const handleStatusChange = (studentId, newStatus) => {
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
        changed: true
      }
    }));
  };

  const handleTimeChange = (studentId, time) => {
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        time,
        changed: true
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setLocalMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
        changed: true
      }
    }));
  };

  const handleBulkMark = (status) => {
    setLocalMarks(prev => {
      const updated = { ...prev };
      attendanceSheet.forEach(item => {
        updated[item.studentId] = {
          ...updated[item.studentId],
          status,
          changed: true
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const recordsToSave = attendanceSheet.map(item => {
        const mark = localMarks[item.studentId] || {};
        return {
          studentId: item.studentId,
          status: mark.status || 'Present',
          time: mark.time || '',
          remarks: mark.remarks || ''
        };
      });

      const res = await api.markAttendance(recordsToSave, selectedDate);
      if (res.success) {
        setSaveMessage('Attendance saved & membership balances updated!');
        setTimeout(() => setSaveMessage(''), 3500);
        loadAttendance();
      }
    } catch (err) {
      alert('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Daily Attendance Register
          </h2>
          <p className="text-xs text-gray-400">
            Mark student class attendance. Present classes automatically count towards active membership cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dojo-850 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
          />

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading}
            className="px-5 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-lg shadow-samurai-600/30 flex items-center gap-2 transition-all"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Attendance
              </>
            )}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {saveMessage}
        </div>
      )}

      {/* Daily Attendance Stats Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800">
          <p className="text-[10px] font-bold uppercase text-gray-400">Total Enrolled</p>
          <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{stats.totalEligible || 0}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <p className="text-[10px] font-bold uppercase">Present</p>
          <p className="text-xl font-black mt-0.5">{stats.present || 0}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          <p className="text-[10px] font-bold uppercase">Absent</p>
          <p className="text-xl font-black mt-0.5">{stats.absent || 0}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
          <p className="text-[10px] font-bold uppercase">On Leave</p>
          <p className="text-xl font-black mt-0.5">{stats.leave || 0}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <p className="text-[10px] font-bold uppercase">Pending Check-in</p>
          <p className="text-xl font-black mt-0.5">{stats.unmarked || 0}</p>
        </div>
      </div>

      {/* Filter and Bulk Action Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs font-medium focus:outline-none"
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          {/* Batch filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs font-medium focus:outline-none"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAttendance()}
              placeholder="Search student..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-gray-400 font-bold uppercase mr-1">Quick Fill:</span>
          <button
            type="button"
            onClick={() => handleBulkMark('Present')}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
          >
            All Present
          </button>
          <button
            type="button"
            onClick={() => handleBulkMark('Absent')}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all"
          >
            All Absent
          </button>
        </div>
      </div>

      {/* Daily Register Table */}
      <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Membership Cycle Usage</th>
                <th className="py-3.5 px-4 text-center">Attendance Status</th>
                <th className="py-3.5 px-4">Check-in Time</th>
                <th className="py-3.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-samurai-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading attendance register...
                  </td>
                </tr>
              ) : attendanceSheet.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No active students found for selected batch/branch.
                  </td>
                </tr>
              ) : (
                attendanceSheet.map((item) => {
                  const mark = localMarks[item.studentId] || { status: 'Present', time: '', remarks: '' };
                  const isPresent = mark.status === 'Present';
                  const isAbsent = mark.status === 'Absent';
                  const isLeave = mark.status === 'Leave';

                  return (
                    <tr
                      key={item.studentId}
                      className="hover:bg-gray-50/60 dark:hover:bg-dojo-800/30 transition-colors"
                    >
                      {/* Student info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-samurai-600/10 text-samurai-600 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                            {item.photo ? (
                              <img src={item.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              item.name?.charAt(0) || 'S'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white leading-tight">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {item.batch?.name || 'Class Session'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-4 font-mono text-xs font-bold text-gray-600 dark:text-gray-300">
                        {item.studentCode}
                      </td>

                      {/* Membership Attendance Tracking Info */}
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {item.packageName}
                          </span>
                          <span className="block text-[11px] text-gray-400">
                            Attended: {item.attendedClasses} classes
                            {item.classLimit ? ` (Remaining: ${item.remainingClasses})` : ' (Unlimited)'}
                          </span>
                        </div>
                      </td>

                      {/* Attendance Toggle Buttons */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-dojo-900 border border-gray-200 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.studentId, 'Present')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-emerald-500'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.studentId, 'Absent')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-rose-500'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.studentId, 'Leave')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              isLeave
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-blue-500'
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={mark.time || ''}
                          onChange={(e) => handleTimeChange(item.studentId, e.target.value)}
                          placeholder="06:30 PM"
                          className="w-24 px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 font-mono focus:outline-none"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={mark.remarks || ''}
                          onChange={(e) => handleRemarksChange(item.studentId, e.target.value)}
                          placeholder="e.g. Belt test prep"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

