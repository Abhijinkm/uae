import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Attendance from './pages/Attendance';
import Memberships from './pages/Memberships';
import Payments from './pages/Payments';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StudentPortal from './pages/StudentPortal';

function ProtectedLayout() {
  const { isAuthenticated, loading, isStudent } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dojo-950">
        <div className="w-12 h-12 border-4 border-samurai-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Get current page header title
  const path = location.pathname;
  let pageTitle = 'Dashboard';
  if (path === '/students') pageTitle = 'Students Directory';
  else if (path.startsWith('/students/')) pageTitle = 'Student Details';
  else if (path === '/attendance') pageTitle = 'Daily Attendance';
  else if (path === '/memberships') pageTitle = 'Memberships & Packages';
  else if (path === '/payments') pageTitle = 'Fee Payments & Receipts';
  else if (path === '/reminders') pageTitle = 'Fee Renewal Reminders';
  else if (path === '/reports') pageTitle = 'Reports & Financials';
  else if (path === '/settings') pageTitle = 'Academy Settings';
  else if (path === '/portal') pageTitle = 'Student Portal';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dojo-950 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={pageTitle} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={isStudent ? <Navigate to="/portal" replace /> : <Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/portal" element={<StudentPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

