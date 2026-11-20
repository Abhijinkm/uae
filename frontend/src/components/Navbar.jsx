import React from 'react';
import { Menu, Moon, Sun, Bell, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuClick, title = 'Dashboard' }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-dojo-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg lg:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Theme Toggle & User Info */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Switch */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-850 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dojo-800 transition-colors shadow-sm"
        >
          {isDark ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* User Role Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
              {user?.name}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-samurai-600 dark:text-samurai-400 font-bold">
              {user?.role}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-samurai-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-samurai-600/30">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

