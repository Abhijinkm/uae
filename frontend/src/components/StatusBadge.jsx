import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const s = String(status || '').toLowerCase();

  let styles = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  let label = status;

  if (s === 'active') {
    styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    label = 'Active';
  } else if (s === 'expiring_soon') {
    styles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse';
    label = 'Expiring Soon';
  } else if (s === 'expired') {
    styles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    label = 'Expired';
  } else if (s === 'present') {
    styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30';
    label = 'Present';
  } else if (s === 'absent') {
    styles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30';
    label = 'Absent';
  } else if (s === 'leave') {
    styles = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30';
    label = 'Leave';
  } else if (s === 'paid' || s === 'completed') {
    styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    label = 'Paid Full';
  } else if (s === 'partial') {
    styles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    label = 'Partial Paid';
  } else if (s === 'pending') {
    styles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    label = 'Pending Fee';
  } else if (s === 'renewed') {
    styles = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    label = 'Renewed';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
}

