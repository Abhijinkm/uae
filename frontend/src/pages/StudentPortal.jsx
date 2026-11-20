import React, { useState, useEffect } from 'react';
import {
  Shield,
  CalendarCheck,
  CreditCard,
  Award,
  Clock,
  Bell,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ReceiptModal from '../components/ReceiptModal';

export default function StudentPortal() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'attendance' | 'payments' | 'notifications'

  // Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      if (user?.studentId) {
        try {
          const res = await api.getStudentById(user.studentId);
          if (res.success) {
            setStudentData(res.data);
          }
        } catch (err) {
          console.error('Failed to load student portal:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadPortal();
  }, [user]);

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.getPaymentReceipt(paymentId);
      if (res.success) {
        setSelectedReceipt(res.receipt);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert('Error fetching receipt: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-samurai-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const student = studentData?.student || user?.studentProfile || {};
  const currentMem = student?.currentMembership;
  const attendanceRecords = studentData?.attendanceRecords || [];
  const paymentRecords = studentData?.paymentRecords || [];
  const stats = studentData?.stats || {};

  const daysLeft = currentMem
    ? Math.ceil((new Date(currentMem.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Student Welcome Hero Card */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-samurai-950 via-dojo-900 to-black text-white border border-samurai-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-samurai-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-samurai-600/30 overflow-hidden">
              {student.photo ? (
                <img src={student.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                '🥋'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Student Warrior Portal
              </div>
              <h1 className="text-2xl font-black font-cinzel tracking-tight">
                Welcome, {student.name || user?.name}
              </h1>
              <p className="text-xs text-gray-300 mt-1 font-mono">
                Student ID: {student.studentId || 'SAM-2026'} • Dojo: {student.branch?.name || 'Main Dojo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-right">
              <p className="text-[10px] uppercase font-bold text-gray-300">Membership Expiry</p>
              <p className="text-sm font-black font-mono text-gold-400">
                {currentMem ? new Date(currentMem.expiryDate).toLocaleDateString() : 'No Plan'}
              </p>
              <p className="text-[10px] text-gray-400">
                {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Active Package</p>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
            {currentMem?.packageName || 'None'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Renews on {currentMem ? new Date(currentMem.nextRenewalDate).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <p className="text-xs font-bold uppercase">Classes Attended</p>
          <h3 className="text-2xl font-black mt-1 font-mono">
            {currentMem?.attendedClasses || 0}
          </h3>
          <p className="text-xs opacity-80 mt-0.5">
            {currentMem?.classLimit ? `${currentMem.remainingClasses} classes remaining` : 'Unlimited Pass'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
          <p className="text-xs font-bold uppercase">Attendance Rate</p>
          <h3 className="text-2xl font-black mt-1 font-mono">
            {stats.attendancePercentage || 0}%
          </h3>
          <p className="text-xs opacity-80 mt-0.5">{stats.totalPresent || 0} classes present</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-bold uppercase text-gray-400">Fee Payment Status</p>
          <div className="mt-2">
            <StatusBadge status={currentMem?.paymentStatus || 'paid'} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Balance Due: <span className="font-bold text-rose-500">{currentMem?.balanceDue || 0} AED</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-samurai-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          }`}
        >
          Membership Overview
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'attendance'
              ? 'bg-samurai-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          }`}
        >
          Attendance Calendar ({attendanceRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments'
              ? 'bg-samurai-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
          }`}
        >
          Payment Receipts ({paymentRecords.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              Membership Plan Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Package Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{currentMem?.packageName || 'None'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Start Date:</span>
                <span className="font-mono font-medium">{currentMem ? new Date(currentMem.startDate).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Expiry Date:</span>
                <span className="font-mono font-bold text-samurai-600">{currentMem ? new Date(currentMem.expiryDate).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Package Fee:</span>
                <span className="font-mono font-bold">{currentMem?.packageAmount || 0} AED</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Total Paid:</span>
                <span className="font-mono font-bold text-emerald-600">{currentMem?.totalPaid || 0} AED</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Training Batch & Instructor
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Batch Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{student.batch?.name || 'Main Class'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Schedule Timings:</span>
                <span className="font-mono">{student.batch?.startTime || '06:00 PM'} - {student.batch?.endTime || '07:30 PM'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Branch Location:</span>
                <span className="font-medium">{student.branch?.name || 'HQ Dojo'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Lead Sensei:</span>
                <span className="font-bold text-gold-500">{student.instructor?.name || 'Head Master'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Calendar */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      No attendance records found yet.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                      <td className="py-3 px-4 font-mono font-medium">{r.date}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs font-mono">{r.time}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{r.remarks || 'Regular class session'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payment Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {paymentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  paymentRecords.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-xs">{p.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-xs">{p.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{p.paidAmount} AED</td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-rose-500">{p.balance > 0 ? `${p.balance} AED` : '0 AED'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt(p._id)}
                          className="px-3 py-1 rounded-lg bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}

