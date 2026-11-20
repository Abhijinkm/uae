import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Receipt,
  BellRing,
  FileBarChart,
  Settings,
  Shield,
  LogOut,
  UserCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isStudent, logout } = useAuth();

  const adminNav = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Daily Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Memberships & Fees', path: '/memberships', icon: Award },
    { name: 'Payments & Receipts', path: '/payments', icon: Receipt },
    { name: 'Fee Reminders', path: '/reminders', icon: BellRing },
    { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart },
    { name: 'Academy Settings', path: '/settings', icon: Settings },
  ];

  const studentNav = [
    { name: 'My Dojo Portal', path: '/portal', icon: Shield }
  ];

  const navItems = isStudent ? studentNav : adminNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-dojo-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800 gap-3">
          <div className="w-10 h-10 rounded-xl bg-samurai-600 flex items-center justify-center text-white shadow-lg shadow-samurai-600/30">
            <span className="text-xl">🥋</span>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wider uppercase font-cinzel text-gray-900 dark:text-white leading-tight">
              Samurai
            </h2>
            <p className="text-[10px] tracking-widest text-samurai-600 dark:text-samurai-400 font-bold uppercase">
              Attendance & Fees
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            {isStudent ? 'Student Access' : 'Management Console'}
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-samurai-600 text-white shadow-lg shadow-samurai-600/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dojo-800 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-dojo-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-samurai-500/10 text-samurai-600 border border-samurai-500/20 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-snug">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user?.role || 'Guest'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

