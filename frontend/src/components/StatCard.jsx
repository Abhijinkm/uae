import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'samurai', subtitle, change }) {
  const colorMap = {
    samurai: {
      bg: 'bg-samurai-500/10 text-samurai-600 dark:text-samurai-400 border-samurai-500/20',
      glow: 'shadow-samurai-500/5'
    },
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'shadow-emerald-500/5'
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'shadow-amber-500/5'
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      glow: 'shadow-blue-500/5'
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'shadow-purple-500/5'
    }
  };

  const currentTheme = colorMap[color] || colorMap.samurai;

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm ${currentTheme.glow} hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${currentTheme.bg}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
      {change && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
          <span className="text-gray-400">{change.label}</span>
          <span className={`font-semibold ${change.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change.value}
          </span>
        </div>
      )}
    </div>
  );
}

