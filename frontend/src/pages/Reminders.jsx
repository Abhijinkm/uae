import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Clock,
  AlertTriangle,
  MessageSquare,
  Phone,
  Calendar,
  Send,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Filter,
  History,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import ReminderModal from '../components/ReminderModal';
import StatusBadge from '../components/StatusBadge';

export default function Reminders() {
  const [renewals, setRenewals] = useState([]);
  const [counts, setCounts] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTierFilter, setActiveTierFilter] = useState('all'); // 'all' | 'expired' | 'due_today' | 'urgent_1d' | 'warning_3d' | 'notice_7d'
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [runningCron, setRunningCron] = useState(false);
  const [cronMessage, setCronMessage] = useState('');

  const loadRenewals = async () => {
    setLoading(true);
    try {
      const [renRes, logRes] = await Promise.all([
        api.getUpcomingRenewals(),
        api.getReminderLogs()
      ]);

      if (renRes.success) {
        setRenewals(renRes.data);
        setCounts(renRes.counts || {});
      }
      if (logRes.success) {
        setLogs(logRes.data);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRenewals();
  }, []);

  const handleRunSweep = async () => {
    setRunningCron(true);
    setCronMessage('');
    try {
      const res = await api.triggerDailyReminderSweep();
      if (res.success) {
        setCronMessage(`Sweep complete! ${res.count} notifications dispatched.`);
        setTimeout(() => setCronMessage(''), 4000);
        loadRenewals();
      }
    } catch (err) {
      alert('Sweep failed: ' + err.message);
    } finally {
      setRunningCron(false);
    }
  };

  const filteredRenewals = renewals.filter((item) => {
    if (activeTierFilter === 'all') return true;
    return item.tier === activeTierFilter;
  });

  return (
    <div className="space-y-6">
      {/* Title & Automated Sweep Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Automated Fee Reminders & Expiry Center
          </h2>
          <p className="text-xs text-gray-400">
            Multi-tiered expiry alerts: 7 days, 3 days, 1 day, on expiry date, and overdue memberships.
          </p>
        </div>

        <button
          onClick={handleRunSweep}
          disabled={runningCron}
          className="px-4 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-lg shadow-samurai-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${runningCron ? 'animate-spin' : ''}`} />
          {runningCron ? 'Running Sweep...' : 'Run Automated Sweep Now'}
        </button>
      </div>

      {cronMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {cronMessage}
        </div>
      )}

      {/* Expiry Tiers Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTierFilter('all')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'all'
              ? 'bg-samurai-600 text-white border-samurai-600 shadow-md shadow-samurai-600/20'
              : 'bg-white dark:bg-dojo-850 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">All Renewals</p>
          <p className="text-xl font-black mt-0.5">{counts.total || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTierFilter('expired')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'expired'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
              : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">Expired</p>
          <p className="text-xl font-black mt-0.5">{counts.expired || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTierFilter('due_today')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'due_today'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
              : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">Due Today</p>
          <p className="text-xl font-black mt-0.5">{counts.dueToday || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTierFilter('urgent_1d')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'urgent_1d'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
              : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">1 Day Left</p>
          <p className="text-xl font-black mt-0.5">{counts.urgent1d || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTierFilter('warning_3d')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'warning_3d'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 text-blue-600 dark:text-blue-400'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">3 Days Left</p>
          <p className="text-xl font-black mt-0.5">{counts.warning3d || 0}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTierFilter('notice_7d')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTierFilter === 'notice_7d'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
              : 'bg-indigo-500/5 dark:bg-indigo-950/20 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <p className="text-[10px] uppercase font-bold opacity-80">7 Days Left</p>
          <p className="text-xl font-black mt-0.5">{counts.notice7d || 0}</p>
        </button>
      </div>

      {/* Renewals Action List */}
      <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            Active Renewal Queue ({filteredRenewals.length})
          </h3>
          <span className="text-xs text-gray-400">Click WhatsApp icon to chat directly with prefilled reminder</span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-samurai-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading upcoming fee renewals...
            </div>
          ) : filteredRenewals.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No students found in this renewal tier.
            </div>
          ) : (
            filteredRenewals.map((item) => (
              <div
                key={item.membershipId}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-dojo-800/30 transition-colors"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-samurai-600/10 text-samurai-600 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
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
                      {item.studentCode} • {item.studentPhone}
                    </p>
                  </div>
                </div>

                {/* Plan & Expiry */}
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {item.packageName} ({item.packageAmount} AED)
                  </p>
                  <p className="text-gray-500 font-mono">
                    Expiry: {new Date(item.expiryDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Status Tier Badge */}
                <div>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-bold rounded-xl ${
                      item.tier === 'expired'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : item.tier === 'urgent_1d' || item.tier === 'due_today'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  {/* Direct WhatsApp link */}
                  <a
                    href={item.whatsappUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Direct WhatsApp
                  </a>

                  {/* Open Customized Modal */}
                  <button
                    onClick={() => setSelectedReminder(item)}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 hover:bg-gray-100 dark:hover:bg-dojo-800 text-gray-600 dark:text-gray-300 text-xs font-semibold"
                    title="Customize & dispatch SMS or in-app notification"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reminder Logs Trail */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-samurai-600" />
          Recent Reminder Dispatches Log
        </h3>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No reminders dispatched yet.</p>
          ) : (
            logs.slice(0, 8).map((log) => (
              <div
                key={log._id}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {log.student?.name} ({log.student?.studentId})
                  </p>
                  <p className="text-gray-400 truncate max-w-md mt-0.5">{log.message}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/10 text-purple-600">
                    {log.channel}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                    {new Date(log.sentAt || log.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reminder Modal */}
      {selectedReminder && (
        <ReminderModal
          isOpen={!!selectedReminder}
          onClose={() => setSelectedReminder(null)}
          reminderItem={selectedReminder}
          onSuccess={loadRenewals}
        />
      )}
    </div>
  );
}

