import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Receipt as ReceiptIcon,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ReceiptModal from '../components/ReceiptModal';
import StatusBadge from '../components/StatusBadge';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [branches, setBranches] = useState([]);
  const [students, setStudents] = useState([]);

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: '',
    paymentMethod: 'Cash',
    transactionReference: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await api.getPayments({
        search: search || undefined,
        branch: selectedBranch || undefined,
        paymentMethod: selectedMethod || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      if (res.success) {
        setPayments(res.data);
        setTotalRevenue(res.totalRevenue || 0);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getBranches().then(res => res.success && setBranches(res.data)).catch(() => {});
    api.getStudents().then(res => res.success && setStudents(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadPayments();
  }, [selectedBranch, selectedMethod, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadPayments();
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    const found = students.find(s => String(s._id) === String(studentId));
    setSelectedStudentDetails(found || null);
    if (found?.currentMembership?.balanceDue) {
      setPaymentForm(prev => ({ ...prev, paidAmount: String(found.currentMembership.balanceDue) }));
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentForm.paidAmount) {
      alert('Please select a student and enter payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.recordPayment({
        studentId: selectedStudentId,
        paidAmount: Number(paymentForm.paidAmount),
        paymentMethod: paymentForm.paymentMethod,
        transactionReference: paymentForm.transactionReference,
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes
      });

      setIsModalOpen(false);
      loadPayments();

      if (res.data?._id) {
        handleOpenReceipt(res.data._id);
      }
    } catch (err) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReceipt = async (paymentId) => {
    try {
      const res = await api.getPaymentReceipt(paymentId);
      if (res.success) {
        setSelectedReceipt(res.receipt);
        setIsReceiptOpen(true);
      }
    } catch (err) {
      alert('Receipt error: ' + err.message);
    }
  };

  // Method breakdown totals
  const cashTotal = payments.filter(p => p.paymentMethod === 'Cash').reduce((a, b) => a + (Number(b.paidAmount) || 0), 0);
  const bankTotal = payments.filter(p => p.paymentMethod === 'Bank Transfer').reduce((a, b) => a + (Number(b.paidAmount) || 0), 0);
  const onlineTotal = payments.filter(p => p.paymentMethod === 'Online / UPI / Card').reduce((a, b) => a + (Number(b.paidAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Fee Payments & Receipts Management
          </h2>
          <p className="text-xs text-gray-400">
            Record cash, bank transfer, and online transactions with automated balance tracking and instant receipts.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedStudentId('');
            setSelectedStudentDetails(null);
            setPaymentForm({
              paidAmount: '',
              paymentMethod: 'Cash',
              transactionReference: '',
              paymentDate: new Date().toISOString().slice(0, 10),
              notes: ''
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-lg shadow-samurai-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record New Payment
        </button>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Filtered Revenue</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-mono">{totalRevenue.toLocaleString()} AED</p>
          <p className="text-[11px] text-gray-400 mt-1">{payments.length} transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider">Cash Payments</p>
          <p className="text-2xl font-black mt-1 font-mono">{cashTotal.toLocaleString()} AED</p>
          <p className="text-[11px] opacity-80 mt-1">Direct reception cash</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider">Bank Transfers</p>
          <p className="text-2xl font-black mt-1 font-mono">{bankTotal.toLocaleString()} AED</p>
          <p className="text-[11px] opacity-80 mt-1">Direct wire & ACH</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider">Online / UPI / Card</p>
          <p className="text-2xl font-black mt-1 font-mono">{onlineTotal.toLocaleString()} AED</p>
          <p className="text-[11px] opacity-80 mt-1">Digital gateway payments</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, student ID, or receipt number (e.g. REC-)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs font-medium focus:outline-none"
            >
              <option value="">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online / UPI / Card">Online / UPI / Card</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white text-xs font-bold transition-all"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] uppercase font-bold text-gray-400 bg-gray-50/50 dark:bg-dojo-900/50">
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Plan</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-samurai-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading payments ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No payment records found matching criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-gray-50/60 dark:hover:bg-dojo-800/30 transition-colors"
                  >
                    {/* Receipt Number */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-gray-800 dark:text-gray-200">
                      {p.receiptNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      {p.student ? (
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">
                            {p.student.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">
                            {p.student.studentId}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Unknown Student</span>
                      )}
                    </td>

                    {/* Membership Plan */}
                    <td className="py-3 px-4 text-xs text-gray-700 dark:text-gray-300">
                      {p.membership?.packageName || 'Membership'}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-dojo-900 text-gray-700 dark:text-gray-300">
                        {p.paymentMethod}
                      </span>
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {p.paidAmount} AED
                    </td>

                    {/* Remaining Balance */}
                    <td className="py-3 px-4 text-xs font-bold font-mono">
                      {p.balance > 0 ? (
                        <span className="text-rose-500">{p.balance} AED</span>
                      ) : (
                        <span className="text-emerald-500">0 AED (Paid)</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReceipt(p._id)}
                        className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-dojo-900 hover:bg-samurai-600 hover:text-white text-xs font-bold text-gray-700 dark:text-gray-300 transition-all inline-flex items-center gap-1.5"
                      >
                        <ReceiptIcon className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Student Fee Payment"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Select Student *</label>
            <select
              required
              value={selectedStudentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId}) — Plan: {s.currentMembership?.packageName || 'None'}
                </option>
              ))}
            </select>
          </div>

          {selectedStudentDetails?.currentMembership && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dojo-900 border border-gray-200 dark:border-gray-800 text-xs space-y-1">
              <p className="font-bold text-gray-900 dark:text-white">
                Active Plan: {selectedStudentDetails.currentMembership.packageName} ({selectedStudentDetails.currentMembership.packageAmount} AED)
              </p>
              <p className="text-gray-500">
                Outstanding Balance: <span className="font-bold text-rose-500">{selectedStudentDetails.currentMembership.balanceDue} AED</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Amount Paid (AED) *</label>
              <input
                type="number"
                required
                min="1"
                value={paymentForm.paidAmount}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                placeholder="e.g. 120"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={paymentForm.transactionReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                placeholder="Optional ref"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Notes</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="e.g. Month renewal fee paid at desk"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-md"
            >
              {submitting ? 'Recording...' : 'Generate Receipt & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptData={selectedReceipt}
      />
    </div>
  );
}

