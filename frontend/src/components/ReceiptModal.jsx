import React from 'react';
import Modal from './Modal';
import { Printer, CheckCircle, ShieldCheck } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, receiptData }) {
  if (!receiptData) return null;

  const {
    receiptNumber,
    paymentDate,
    student = {},
    membership = {},
    amount = 0,
    paidAmount = 0,
    balance = 0,
    paymentMethod = 'Cash',
    transactionReference = '',
    receivedBy = 'Admin',
    academy = {
      name: 'Samurai Martial Arts Academy',
      tagline: 'Discipline • Strength • Honor',
      address: '850 Bushido Way, Sector 1, Martial Arts District',
      phone: '+1 (555) 726-8724',
      email: 'contact@samuraiacademy.com',
      currency: 'AED'
    }
  } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(paymentDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const startDateStr = membership?.startDate ? new Date(membership.startDate).toLocaleDateString() : 'N/A';
  const expiryDateStr = membership?.expiryDate ? new Date(membership.expiryDate).toLocaleDateString() : 'N/A';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Payment Receipt" maxWidth="max-w-2xl">
      <div className="flex justify-end mb-2 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-samurai-600 hover:bg-samurai-700 text-white font-medium rounded-xl shadow-lg shadow-samurai-600/20 transition-all text-sm"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      <div
        id="printable-receipt"
        className="bg-white text-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm relative overflow-hidden"
      >
        {/* Subtle Watermark */}
        <div className="absolute right-4 bottom-12 opacity-5 pointer-events-none select-none text-9xl font-cinzel">
          🥋
        </div>

        {/* Academy Header */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-gray-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-3xl">🥋</span>
              <h1 className="text-2xl font-black tracking-tight font-cinzel text-samurai-700">
                {academy.name}
              </h1>
            </div>
            <p className="text-xs uppercase tracking-widest text-gold-600 font-bold mb-2">
              {academy.tagline}
            </p>
            <p className="text-xs text-gray-500">{academy.address}</p>
            <p className="text-xs text-gray-500">Phone: {academy.phone} • Email: {academy.email}</p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-samurai-50 text-samurai-700 border border-samurai-200 text-xs font-bold rounded-lg mb-2">
              OFFICIAL RECEIPT
            </span>
            <p className="text-sm font-black font-mono text-gray-800">{receiptNumber}</p>
            <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
          </div>
        </div>

        {/* Student & Package Meta */}
        <div className="grid grid-cols-2 gap-4 py-5 border-b border-gray-100 text-sm">
          <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Billed To (Student)</p>
            <p className="font-bold text-gray-900 text-base">{student.name}</p>
            <p className="text-xs text-gray-600 font-mono">ID: {student.studentCode || student.studentId}</p>
            <p className="text-xs text-gray-600">Phone: {student.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-gray-400 mb-1">Membership Plan</p>
            <p className="font-bold text-gray-900 text-base">{membership?.packageName || 'Martial Arts Training'}</p>
            <p className="text-xs text-gray-600">Validity: <span className="font-medium text-gray-800">{startDateStr}</span> to <span className="font-medium text-gray-800">{expiryDateStr}</span></p>
            <p className="text-xs text-emerald-700 font-medium">Status: Active Membership</p>
          </div>
        </div>

        {/* Financial Table */}
        <table className="w-full my-6 text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase font-bold text-gray-500 text-left">
              <th className="py-2">Description</th>
              <th className="py-2">Payment Method</th>
              <th className="py-2 text-right">Package Fee</th>
              <th className="py-2 text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 font-medium text-gray-900">
                {membership?.packageName || 'Membership Training Session'}
                {transactionReference && (
                  <span className="block text-xs text-gray-400">Ref: {transactionReference}</span>
                )}
              </td>
              <td className="py-3 text-gray-700">{paymentMethod}</td>
              <td className="py-3 text-right text-gray-700">{amount.toFixed(2)} {academy.currency || 'AED'}</td>
              <td className="py-3 text-right font-bold text-emerald-600">{paidAmount.toFixed(2)} {academy.currency || 'AED'}</td>
            </tr>
          </tbody>
        </table>

        {/* Totals & Outstanding Balance */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total Package Amount:</span>
              <span>{amount.toFixed(2)} {academy.currency || 'AED'}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2">
              <span>Amount Paid:</span>
              <span className="text-emerald-600">{paidAmount.toFixed(2)} {academy.currency || 'AED'}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-200 pt-2">
              <span className={balance > 0 ? 'text-rose-600' : 'text-gray-600'}>
                Remaining Balance:
              </span>
              <span className={balance > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {balance > 0 ? `${balance.toFixed(2)} ${academy.currency || 'AED'}` : 'PAID IN FULL'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signature */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 mb-1">
              <ShieldCheck className="w-4 h-4" />
              Verified Electronic Transaction
            </div>
            <p>Thank you for training with {academy.name}.</p>
            <p>This is a computer-generated receipt and requires no physical stamp.</p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-gray-400 mb-1"></div>
            <p className="font-bold text-gray-800">{receivedBy}</p>
            <p className="text-[10px] text-gray-400">Authorized Academy Officer</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

