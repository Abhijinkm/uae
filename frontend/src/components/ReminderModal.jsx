import React, { useState } from 'react';
import Modal from './Modal';
import { Send, MessageSquare, Phone, ExternalLink, Check, Bell } from 'lucide-react';
import { api } from '../services/api';

export default function ReminderModal({ isOpen, onClose, reminderItem, onSuccess }) {
  if (!reminderItem) return null;

  const [message, setMessage] = useState(reminderItem.message || '');
  const [channel, setChannel] = useState('whatsapp');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await api.sendManualReminder({
        studentId: reminderItem.studentId,
        membershipId: reminderItem.membershipId,
        channel,
        customMessage: message
      });

      if (channel === 'whatsapp' && res.actionUrl) {
        window.open(res.actionUrl, '_blank');
      }

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to send reminder: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Fee Renewal Reminder" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Student Snapshot */}
        <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-dojo-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="w-12 h-12 rounded-xl bg-samurai-600/10 text-samurai-600 flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
            {reminderItem.studentPhoto ? (
              <img src={reminderItem.studentPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              reminderItem.studentName?.charAt(0) || 'S'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{reminderItem.studentName}</h4>
            <p className="text-xs text-gray-500 font-mono">ID: {reminderItem.studentCode} • {reminderItem.studentPhone}</p>
            <p className="text-xs text-samurai-600 dark:text-samurai-400 font-medium">
              Plan: {reminderItem.packageName} • {reminderItem.label}
            </p>
          </div>
        </div>

        {/* Channel Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Notification Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                channel === 'whatsapp'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dojo-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                channel === 'sms'
                  ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dojo-900'
              }`}
            >
              <Phone className="w-4 h-4 text-blue-500" />
              Direct SMS
            </button>
            <button
              type="button"
              onClick={() => setChannel('in_app')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                channel === 'in_app'
                  ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dojo-900'
              }`}
            >
              <Bell className="w-4 h-4 text-purple-500" />
              In-App Alert
            </button>
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Reminder Message Preview (Customizable)
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dojo-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
            placeholder="Type reminder message..."
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {channel === 'whatsapp' ? 'Opens WhatsApp chat with prefilled message ready to hit send.' : 'Logs and dispatches notification instantly.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || sentSuccess}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
              sentSuccess
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : channel === 'whatsapp'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-samurai-600 hover:bg-samurai-700 shadow-samurai-600/30'
            }`}
          >
            {sentSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Dispatched!
              </>
            ) : sending ? (
              'Processing...'
            ) : channel === 'whatsapp' ? (
              <>
                <ExternalLink className="w-4 h-4" />
                Open WhatsApp & Send
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

