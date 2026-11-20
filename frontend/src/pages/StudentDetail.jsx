import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Award,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Receipt,
  MessageSquare,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Percent,
  CalendarCheck
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ReceiptModal from '../components/ReceiptModal';
import ReminderModal from '../components/ReminderModal';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'payments' | 'memberships'

  // Modal states
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReminderItem, setSelectedReminderItem] = useState(null);

  // Renewal Modal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [packages, setPackages] = useState([]);
  const [renewalForm, setRenewalForm] = useState({
    packageId: '',
    startDate: new Date().toISOString().slice(0, 10),
    totalPaid: '',
    paymentMethod: 'Cash',
    notes: 'Standard renewal'
  });
  const [renewalExpiryPreview, setRenewalExpiryPreview] = useState('');
  const [submittingRenewal, setSubmittingRenewal] = useState(false);

  // Record Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: '',
    paymentMethod: 'Cash',
    transactionReference: '',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchStudent = async () => {
    try {
      const res = await api.getStudentById(id);
      if (res.success) {
        setStudentData(res.data);
      }
    } catch (err) {
      console.error('Failed to load student:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    api.getPackages().then(res => {
      if (res.success) setPackages(res.data);
    }).catch(() => {});
  }, [id]);

  // Preview renewal expiry date
  useEffect(() => {
    if (renewalForm.packageId && renewalForm.startDate) {
      const selectedPkg = packages.find(p => String(p._id) === String(renewalForm.packageId));
      if (selectedPkg) {
        api.calculateDates(renewalForm.startDate, selectedPkg.durationMonths, selectedPkg.durationDays)
          .then(res => {
            if (res.success) {
              setRenewalExpiryPreview(res.expiryDate);
              if (!renewalForm.totalPaid) {
                setRenewalForm(prev => ({ ...prev, totalPaid: String(selectedPkg.feeAmount) }));
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [renewalForm.packageId, renewalForm.startDate, packages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-samurai-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!studentData || !studentData.student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Student not found.</p>
        <Link to="/students" className="mt-4 inline-block text-samurai-600 hover:underline">
          Return to Students list
        </Link>
      </div>
    );
  }

  const { student, membershipHistory = [], attendanceRecords = [], paymentRecords = [], stats = {} } = studentData;
  const currentMem = student.currentMembership;

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.getPaymentReceipt(paymentId);
      if (res.success) {
        setSelectedReceipt(res.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      alert('Error loading receipt: ' + err.message);
    }
  };

  const handleOpenReminder = () => {
    if (!currentMem) return;
    const daysUntil = Math.ceil((new Date(currentMem.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    setSelectedReminderItem({
      studentId: student._id,
      membershipId: currentMem._id,
      studentName: student.name,
      studentCode: student.studentId,
      studentPhone: student.phone,
      studentPhoto: student.photo,
      packageName: currentMem.packageName,
      label: daysUntil < 0 ? `Expired (${Math.abs(daysUntil)} days ago)` : `${daysUntil} days left`,
      message: `Dear ${student.name}, reminder from Samurai Martial Arts Academy regarding your ${currentMem.packageName} membership renewal.`
    });
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRenewal(true);
    try {
      await api.renewMembership({
        studentId: student._id,
        packageId: renewalForm.packageId,
        startDate: renewalForm.startDate,
        totalPaid: Number(renewalForm.totalPaid) || 0,
        paymentMethod: renewalForm.paymentMethod,
        notes: renewalForm.notes
      });
      setIsRenewModalOpen(false);
      fetchStudent();
    } catch (err) {
      alert('Failed to renew membership: ' + err.message);
    } finally {
      setSubmittingRenewal(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      const res = await api.recordPayment({
        studentId: student._id,
        membershipId: currentMem ? currentMem._id : null,
        paidAmount: Number(paymentForm.paidAmount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes
      });
      setIsPaymentModalOpen(false);
      fetchStudent();
      if (res.data?._id) {
        handleOpenReceipt(res.data._id);
      }
    } catch (err) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dojo-850 hover:bg-gray-100 dark:hover:bg-dojo-800 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Student Profile & History
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            {student.studentId} • Registered {new Date(student.joiningDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Top Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-samurai-600/10 text-samurai-600 border-2 border-samurai-600/20 flex items-center justify-center font-bold text-3xl overflow-hidden flex-shrink-0 shadow-md">
              {student.photo ? (
                <img src={student.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                student.name?.charAt(0) || 'S'
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                  {student.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-samurai-500/10 text-samurai-600 dark:text-samurai-400 border border-samurai-500/20">
                  {student.art || 'Karate'}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-dojo-800 text-gray-600 dark:text-gray-300">
                  {student.gender || 'Male'}
                </span>
                <StatusBadge status={student.status} />
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {student.phone}
                </span>
                {student.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {student.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {student.branch?.name || 'Main Dojo'}
                </span>
                <span className="flex items-center gap-1 font-semibold text-samurai-600 dark:text-samurai-400">
                  <Clock className="w-3.5 h-3.5" />
                  {student.batch?.name || 'Regular Batch'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
            <button
              onClick={() => {
                setRenewalForm({
                  packageId: packages[0]?._id || '',
                  startDate: new Date().toISOString().slice(0, 10),
                  totalPaid: packages[0] ? String(packages[0].feeAmount) : '',
                  paymentMethod: 'Cash',
                  notes: 'Cycle renewal'
                });
                setIsRenewModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs shadow-md shadow-samurai-600/20 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Renew Membership
            </button>

            <button
              onClick={() => {
                setPaymentForm({
                  paidAmount: currentMem?.balanceDue > 0 ? String(currentMem.balanceDue) : '',
                  paymentMethod: 'Cash',
                  transactionReference: '',
                  notes: 'Fee installment'
                });
                setIsPaymentModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Record Payment
            </button>

            {currentMem && (
              <button
                onClick={handleOpenReminder}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 hover:bg-gray-100 dark:hover:bg-dojo-800 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                WhatsApp Reminder
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Date-to-Date Membership Period & Attendance Tracking Card */}
      {currentMem ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white via-white to-gray-50 dark:from-dojo-850 dark:via-dojo-850 dark:to-dojo-900 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Current Date-to-Date Membership Period (Cycle #{currentMem.cycleNumber})
              </h3>
            </div>
            <StatusBadge status={currentMem.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2 border-y border-gray-100 dark:border-gray-800/80 my-4 text-sm">
            <div>
              <p className="text-xs uppercase font-bold text-gray-400">Package Plan</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{currentMem.packageName}</p>
              <p className="text-xs text-gray-500">Amount: {currentMem.packageAmount} AED</p>
            </div>

            <div>
              <p className="text-xs uppercase font-bold text-gray-400">Membership Valid From</p>
              <p className="font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                {new Date(currentMem.startDate).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-gray-500">Calculated from joining date</p>
            </div>

            <div>
              <p className="text-xs uppercase font-bold text-gray-400">Expiry Date</p>
              <p className="font-bold text-samurai-600 dark:text-samurai-400 font-mono mt-0.5">
                {new Date(currentMem.expiryDate).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-gray-500">Next renewal: {new Date(currentMem.nextRenewalDate).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-xs uppercase font-bold text-gray-400">Payment Status</p>
              <div className="mt-0.5">
                <StatusBadge status={currentMem.paymentStatus} size="sm" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Balance Due: <span className="font-bold text-rose-500">{currentMem.balanceDue || 0} AED</span>
              </p>
            </div>
          </div>

          {/* Attendance Tracking Against This Membership Cycle */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-500" />
                Classes Attended in this Membership Period: {currentMem.attendedClasses || 0}
                {currentMem.classLimit && ` / ${currentMem.classLimit} max`}
              </span>
              <span>
                {currentMem.classLimit
                  ? `${currentMem.remainingClasses ?? 0} classes remaining`
                  : 'Unlimited Classes Access'}
              </span>
            </div>

            {currentMem.classLimit && (
              <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-dojo-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-samurai-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((currentMem.attendedClasses || 0) / currentMem.classLimit) * 100))}%`
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm flex items-center justify-between">
          <p>This student currently has no active membership cycle.</p>
          <button
            onClick={() => setIsRenewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md"
          >
            Assign Membership Plan
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-samurai-600 text-samurai-600 dark:text-samurai-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Attendance History ({attendanceRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-samurai-600 text-samurai-600 dark:text-samurai-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Payments & Receipts ({paymentRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('memberships')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'memberships'
              ? 'border-samurai-600 text-samurai-600 dark:text-samurai-400'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Award className="w-4 h-4" />
          All Membership Cycles ({membershipHistory.length})
        </button>
      </div>

      {/* Tab 1: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                      No attendance records found for this student.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                      <td className="py-3 px-4 font-mono font-medium">{r.date}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{r.time || '--'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {r.batch?.name || 'Class Session'}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">{r.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {paymentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                      No payment records found.
                    </td>
                  </tr>
                ) : (
                  paymentRecords.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-gray-800 dark:text-gray-200">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-700 dark:text-gray-300">
                        {p.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {p.amount} AED
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-emerald-600">
                        {p.paidAmount} AED
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-rose-500">
                        {p.balance > 0 ? `${p.balance} AED` : '0 AED (Clear)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReceipt(p._id)}
                          className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-dojo-900 hover:bg-samurai-600 hover:text-white text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
                        >
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

      {/* Tab 3: All Membership Cycles */}
      {activeTab === 'memberships' && (
        <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                  <th className="py-3 px-4">Cycle #</th>
                  <th className="py-3 px-4">Package Name</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Classes Attended</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {membershipHistory.map((m) => (
                  <tr key={m._id} className="hover:bg-gray-50/50 dark:hover:bg-dojo-800/30">
                    <td className="py-3 px-4 font-bold text-xs">Cycle #{m.cycleNumber}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{m.packageName}</td>
                    <td className="py-3 px-4 font-mono text-xs">{new Date(m.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono text-xs">{new Date(m.expiryDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{m.attendedClasses || 0} classes</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={`Renew Membership for ${student.name}`}
      >
        <form onSubmit={handleRenewalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Select Package</label>
            <select
              required
              value={renewalForm.packageId}
              onChange={(e) => setRenewalForm({ ...renewalForm, packageId: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            >
              <option value="">Select Package</option>
              {packages.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.feeAmount} AED ({p.durationMonths} Mo)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Renewal Start Date</label>
              <input
                type="date"
                required
                value={renewalForm.startDate}
                onChange={(e) => setRenewalForm({ ...renewalForm, startDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Calculated Expiry</label>
              <input
                type="text"
                readOnly
                value={renewalExpiryPreview || 'Calculating...'}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-dojo-950 text-sm font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Amount Paid (AED)</label>
              <input
                type="number"
                required
                value={renewalForm.totalPaid}
                onChange={(e) => setRenewalForm({ ...renewalForm, totalPaid: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
              <select
                value={renewalForm.paymentMethod}
                onChange={(e) => setRenewalForm({ ...renewalForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online / UPI / Card">Online / UPI / Card</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRenewal}
              className="px-5 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-md"
            >
              {submittingRenewal ? 'Renewing...' : 'Confirm Renewal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${student.name}`}
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Payment Amount (AED)</label>
            <input
              type="number"
              required
              min="1"
              value={paymentForm.paidAmount}
              onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
              placeholder="e.g. 100"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online / UPI / Card">Online / UPI / Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Transaction Ref (Optional)</label>
              <input
                type="text"
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="UPI / Cheque / Bank Ref"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
            >
              {submittingPayment ? 'Recording...' : 'Generate Receipt & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt View & Print Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={selectedReceipt}
      />

      {/* Reminder Modal */}
      {selectedReminderItem && (
        <ReminderModal
          isOpen={!!selectedReminderItem}
          onClose={() => setSelectedReminderItem(null)}
          reminderItem={selectedReminderItem}
          onSuccess={fetchStudent}
        />
      )}
    </div>
  );
}

