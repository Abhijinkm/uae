import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [emailOrId, setEmailOrId] = useState('admin@samurai.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(emailOrId, password);
      if (user.role === 'student') {
        navigate('/portal');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'admin') {
      setEmailOrId('admin@samurai.com');
      setPassword('admin123');
    } else if (role === 'staff') {
      setEmailOrId('staff@samurai.com');
      setPassword('staff123');
    } else if (role === 'student') {
      setEmailOrId('student@samurai.com');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-dojo-950 to-black text-gray-100">
      <div className="w-full max-w-md bg-white dark:bg-dojo-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-8 relative overflow-hidden text-gray-900 dark:text-gray-100">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-samurai-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Logo & Title */}
        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-samurai-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-samurai-600/30 text-3xl">
            🥋
          </div>
          <h2 className="text-2xl font-black font-cinzel tracking-wider uppercase">
            Samurai Academy
          </h2>
          <p className="text-xs uppercase tracking-widest text-samurai-600 dark:text-samurai-400 font-bold mt-1">
            Attendance & Fee Reminder System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Email / Student ID
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                required
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                placeholder="admin@samurai.com or SAM-2026-001"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-950 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-950 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-samurai-600/30 flex items-center justify-center gap-2 transition-all mt-2"
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* One-Click Quick Demo Login Buttons */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-bold uppercase tracking-wider text-center text-gray-400 mb-3">
            Quick One-Click Demo Access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin')}
              className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                emailOrId.includes('admin')
                  ? 'border-samurai-500 bg-samurai-500/10 text-samurai-600 dark:text-samurai-400'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dojo-800'
              }`}
            >
              🥋 Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('staff')}
              className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                emailOrId.includes('staff')
                  ? 'border-samurai-500 bg-samurai-500/10 text-samurai-600 dark:text-samurai-400'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dojo-800'
              }`}
            >
              📋 Staff
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('student')}
              className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                emailOrId.includes('student')
                  ? 'border-samurai-500 bg-samurai-500/10 text-samurai-600 dark:text-samurai-400'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dojo-800'
              }`}
            >
              🥊 Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

