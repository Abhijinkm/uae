import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Calculator,
  Shield,
  Layers,
  Edit2,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function Memberships() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date-to-Date Interactive Calculator Tool
  const [calcDate, setCalcDate] = useState('2026-11-19'); // Requirement example date
  const [calcMonths, setCalcMonths] = useState(1);
  const [calcDays, setCalcDays] = useState(0);
  const [calcResult, setCalcResult] = useState(null);

  // Package Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'monthly',
    durationMonths: 1,
    durationDays: 0,
    classLimit: '',
    feeAmount: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api.getPackages();
      if (res.success) setPackages(res.data);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Run Date-to-Date preview
  useEffect(() => {
    if (calcDate) {
      api.calculateDates(calcDate, calcMonths, calcDays)
        .then(res => {
          if (res.success) setCalcResult(res);
        })
        .catch(() => {});
    }
  }, [calcDate, calcMonths, calcDays]);

  const handleOpenCreate = () => {
    setEditingPkg(null);
    setFormData({
      name: '',
      type: 'monthly',
      durationMonths: 1,
      durationDays: 0,
      classLimit: '',
      feeAmount: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name || '',
      type: pkg.type || 'monthly',
      durationMonths: pkg.durationMonths || 1,
      durationDays: pkg.durationDays || 0,
      classLimit: pkg.classLimit || '',
      feeAmount: pkg.feeAmount || '',
      description: pkg.description || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPkg) {
        await api.updatePackage(editingPkg._id, formData);
      } else {
        await api.createPackage(formData);
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (err) {
      alert('Operation failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Deactivate package "${pkg.name}"?`)) return;
    try {
      await api.deletePackage(pkg._id);
      fetchPackages();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Smart Fee & Membership Management
          </h2>
          <p className="text-xs text-gray-400">
            Configure flexible monthly or class-pack memberships with automated date-to-date calculation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-sm shadow-lg shadow-samurai-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Package
        </button>
      </div>

      {/* Featured Feature Box: Interactive Date-to-Date Fee Calculation */}
      <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-samurai-950/90 via-dojo-900 to-black text-white border border-samurai-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-samurai-600/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Calculator className="w-4 h-4" />
            Core Requirement Feature
          </div>
          <h3 className="text-xl lg:text-2xl font-black font-cinzel">
            Date-to-Date Membership Calculation Engine
          </h3>
          <p className="text-xs text-gray-300 max-w-2xl mt-1">
            Memberships in Samurai are calculated based on the student's actual joining date (e.g. November 19 + 1 Month = December 19 expiry), rather than generic calendar month boundaries. Try the simulator below:
          </p>

          {/* Interactive Calculator Inputs */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-300 mb-1">
                Student Joining Date
              </label>
              <input
                type="date"
                value={calcDate}
                onChange={(e) => setCalcDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-dojo-950 text-white border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-300 mb-1">
                Duration (Months)
              </label>
              <select
                value={calcMonths}
                onChange={(e) => setCalcMonths(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dojo-950 text-white border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
              >
                <option value={1}>1 Month (Standard)</option>
                <option value={3}>3 Months (Quarterly)</option>
                <option value={6}>6 Months (Semi-Annual)</option>
                <option value={12}>12 Months (Annual)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-300 mb-1">
                Extra Custom Days
              </label>
              <input
                type="number"
                min="0"
                value={calcDays}
                onChange={(e) => setCalcDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-dojo-950 text-white border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-samurai-500"
              />
            </div>

            <div className="flex flex-col justify-center border-l border-white/10 pl-4">
              <p className="text-[10px] uppercase font-bold text-gray-400">Calculated Expiry Date</p>
              <p className="text-xl font-black font-mono text-gold-400 mt-0.5">
                {calcResult?.expiryDate || 'Calculating...'}
              </p>
              <p className="text-[10px] text-gray-400">
                Next Renewal Date: <span className="text-white font-mono">{calcResult?.nextRenewalDate}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Packages Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-samurai-600" />
          Active Academy Membership Packages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm hover:border-samurai-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-samurai-500/10 text-samurai-600 dark:text-samurai-400 border border-samurai-500/20">
                    {pkg.type === 'class_pack' ? 'Class Pass' : `${pkg.durationMonths} Month Duration`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      className="p-1 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-black text-gray-900 dark:text-white">
                  {pkg.name}
                </h4>
                <p className="text-xs text-gray-400 mt-1 min-h-[36px]">
                  {pkg.description || 'Full access to daily martial arts classes.'}
                </p>

                <div className="my-5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{pkg.feeAmount}</span>
                  <span className="text-sm font-bold text-samurai-600 dark:text-samurai-400">AED</span>
                  <span className="text-xs text-gray-400">
                    / {pkg.durationMonths > 0 ? `${pkg.durationMonths} Mo` : `${pkg.durationDays} Days`}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Calculated date-to-date from joining date</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>
                      {pkg.classLimit ? `${pkg.classLimit} classes limit included` : 'Unlimited attendance sessions'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Automated 7d, 3d, 1d fee renewal alerts</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Status: Active</span>
                <span className="font-mono">ID: {pkg._id?.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPkg ? 'Edit Membership Package' : 'Create Membership Package'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Package Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. 3 Months Quarterly Pro"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Package Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              >
                <option value="monthly">Monthly Recurring</option>
                <option value="class_pack">Class Pack Limit</option>
                <option value="custom">Custom Duration</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Fee Amount (AED) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.feeAmount}
                onChange={(e) => setFormData({ ...formData, feeAmount: e.target.value })}
                placeholder="e.g. 150"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Duration (Months)</label>
              <input
                type="number"
                min="0"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Custom Days</label>
              <input
                type="number"
                min="0"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Class Limit (Optional)</label>
              <input
                type="number"
                min="1"
                value={formData.classLimit}
                onChange={(e) => setFormData({ ...formData, classLimit: e.target.value })}
                placeholder="Leave blank for unlimited"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Package perks, uniform discounts..."
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
              {submitting ? 'Saving...' : editingPkg ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

