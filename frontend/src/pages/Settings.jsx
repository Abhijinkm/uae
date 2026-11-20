import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Users,
  Clock,
  Bell,
  Shield,
  Save,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  History,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('academy'); // 'academy' | 'reminders' | 'branches' | 'batches' | 'instructors' | 'staff' | 'audit'

  const [settings, setSettings] = useState({
    academyName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    currency: 'AED',
    whatsappCountryCode: '+971',
    reminderTemplates: {
      upcoming7: '',
      upcoming3: '',
      upcoming1: '',
      onExpiry: '',
      expired: ''
    }
  });

  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Branch Modal State (Add & Edit)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', email: '' });
  const [submittingBranch, setSubmittingBranch] = useState(false);

  // Batch Modal State (Add & Edit)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({
    name: '',
    branch: '',
    days: 'Mon, Wed, Fri',
    startTime: '06:00 PM',
    endTime: '07:30 PM',
    capacity: 30
  });
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Instructor Modal State
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);
  const [instructorForm, setInstructorForm] = useState({ name: '', phone: '', email: '', specialization: '', branch: '' });

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'staff', phone: '' });

  const loadAll = async () => {
    try {
      const [sRes, brRes, baRes, instRes, stRes, aRes] = await Promise.all([
        api.getSettings(),
        api.getBranches(),
        api.getBatches(),
        api.getInstructors(),
        api.getStaffUsers(),
        api.getAuditLogs()
      ]);

      if (sRes.success) setSettings(sRes.data);
      if (brRes.success) setBranches(brRes.data);
      if (baRes.success) setBatches(baRes.data);
      if (instRes.success) setInstructors(instRes.data);
      if (stRes.success) setStaffUsers(stRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSaveSuccess('Academy configuration saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Branch handlers (Single branch edit)
  const handleOpenEditBranch = (branch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || ''
    });
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBranch(true);
    try {
      if (editingBranch) {
        await api.updateBranch(editingBranch._id, branchForm);
      } else {
        await api.createBranch(branchForm);
      }
      setIsBranchModalOpen(false);
      setEditingBranch(null);
      loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingBranch(false);
    }
  };

  // Batch handlers (Add, Edit, Delete)
  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setBatchForm({
      name: '',
      branch: branches[0]?._id || '',
      days: 'Mon, Wed, Fri',
      startTime: '06:00 PM',
      endTime: '07:30 PM',
      capacity: 30
    });
    setIsBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      name: batch.name || '',
      branch: batch.branch?._id || batch.branch || branches[0]?._id || '',
      days: Array.isArray(batch.days) ? batch.days.join(', ') : (batch.days || 'Mon, Wed, Fri'),
      startTime: batch.startTime || '06:00 PM',
      endTime: batch.endTime || '07:30 PM',
      capacity: batch.capacity || 30
    });
    setIsBatchModalOpen(true);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBatch(true);
    try {
      const daysArray = typeof batchForm.days === 'string'
        ? batchForm.days.split(',').map(d => d.trim()).filter(Boolean)
        : batchForm.days;

      const payload = {
        name: batchForm.name,
        branch: batchForm.branch || branches[0]?._id,
        days: daysArray,
        startTime: batchForm.startTime,
        endTime: batchForm.endTime,
        capacity: Number(batchForm.capacity) || 30
      };

      if (editingBatch) {
        await api.updateBatch(editingBatch._id, payload);
      } else {
        await api.createBatch(payload);
      }
      setIsBatchModalOpen(false);
      setEditingBatch(null);
      loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Are you sure you want to permanently delete batch "${batch.name}"?`)) {
      return;
    }
    try {
      await api.deleteBatch(batch._id);
      loadAll();
    } catch (err) {
      alert('Failed to delete batch: ' + err.message);
    }
  };

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    try {
      await api.createInstructor({
        ...instructorForm,
        branch: branches[0]?._id
      });
      setIsInstructorModalOpen(false);
      setInstructorForm({ name: '', phone: '', email: '', specialization: '', branch: '' });
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.registerStaff({
        ...staffForm,
        branch: branches[0]?._id
      });
      setIsStaffModalOpen(false);
      setStaffForm({ name: '', email: '', password: '', role: 'staff', phone: '' });
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const mainBranch = branches[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Academy Settings & System Configuration
        </h2>
        <p className="text-xs text-gray-400">
          Manage your academy headquarters, training batches (with full edit support), instructors, and reminders.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {saveSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {[
          { key: 'academy', label: 'Academy Branding', icon: SettingsIcon },
          { key: 'reminders', label: 'Reminder Templates', icon: Bell },
          { key: 'branches', label: 'Main Branch', icon: Building },
          { key: 'batches', label: 'Batches (Edit / Manage)', icon: Clock },
          { key: 'instructors', label: 'Instructors', icon: Users },
          { key: 'staff', label: 'Staff & Roles', icon: UserCheck },
          { key: 'audit', label: 'Audit Trail', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-samurai-600 text-white shadow-md shadow-samurai-600/20'
                  : 'bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Academy Branding */}
      {activeTab === 'academy' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 max-w-3xl">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Academy Identity & Receipt Branding</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Academy Name</label>
              <input
                type="text"
                value={settings.academyName || ''}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Tagline</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currency || 'AED'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Default WhatsApp Country Code</label>
              <input
                type="text"
                value={settings.whatsappCountryCode || '+971'}
                onChange={(e) => setSettings({ ...settings, whatsappCountryCode: e.target.value })}
                placeholder="+971"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs shadow-md shadow-samurai-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Academy Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Reminder Templates */}
      {activeTab === 'reminders' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 max-w-3xl">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Custom Automated Reminder Messages</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Available placeholders: <code className="text-samurai-600 font-mono">&#123;student_name&#125;</code>, <code className="text-samurai-600 font-mono">&#123;package_name&#125;</code>, <code className="text-samurai-600 font-mono">&#123;expiry_date&#125;</code>, <code className="text-samurai-600 font-mono">&#123;amount_due&#125;</code>, <code className="text-samurai-600 font-mono">&#123;academy_name&#125;</code>
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-indigo-500 mb-1 uppercase tracking-wider">
                7 Days Before Expiry Template
              </label>
              <textarea
                rows={2}
                value={settings.reminderTemplates?.upcoming7 || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderTemplates: { ...settings.reminderTemplates, upcoming7: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-500 mb-1 uppercase tracking-wider">
                3 Days Before Expiry Template
              </label>
              <textarea
                rows={2}
                value={settings.reminderTemplates?.upcoming3 || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderTemplates: { ...settings.reminderTemplates, upcoming3: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-500 mb-1 uppercase tracking-wider">
                1 Day Before Expiry (Urgent) Template
              </label>
              <textarea
                rows={2}
                value={settings.reminderTemplates?.upcoming1 || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderTemplates: { ...settings.reminderTemplates, upcoming1: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-500 mb-1 uppercase tracking-wider">
                On Expiry Date Template
              </label>
              <textarea
                rows={2}
                value={settings.reminderTemplates?.onExpiry || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderTemplates: { ...settings.reminderTemplates, onExpiry: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-500 mb-1 uppercase tracking-wider">
                After Expiry (Expired) Template
              </label>
              <textarea
                rows={2}
                value={settings.reminderTemplates?.expired || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  reminderTemplates: { ...settings.reminderTemplates, expired: e.target.value }
                })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs shadow-md shadow-samurai-600/30 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Reminder Templates'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Single Primary Branch (Single Branch Mode) */}
      {activeTab === 'branches' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Academy Facility & Primary Branch</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Your academy operates as a unified single facility. All batches, instructors, and students belong here.
              </p>
            </div>
            {mainBranch && (
              <button
                onClick={() => handleOpenEditBranch(mainBranch)}
                className="px-4 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-samurai-600/20 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Branch Details
              </button>
            )}
          </div>

          {mainBranch ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-dojo-900 dark:to-dojo-950 border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-samurai-500/10 text-samurai-600 border border-samurai-500/20">
                  CODE: {mainBranch.code}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Primary Facility (Active)
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white">
                  {mainBranch.name}
                </h4>
                <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-samurai-600 flex-shrink-0" />
                    <span>{mainBranch.address || '850 Bushido Way, Sector 1, Martial Arts District'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-samurai-600 flex-shrink-0" />
                    <span>{mainBranch.phone || '+1 (555) 726-8701'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-samurai-600 flex-shrink-0" />
                    <span>{mainBranch.email || 'contact@samuraiacademy.com'}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p>No branch configured yet.</p>
              <button
                onClick={() => {
                  setEditingBranch(null);
                  setBranchForm({ name: 'Samurai Main Academy', code: 'SAM', address: '', phone: '', email: '' });
                  setIsBranchModalOpen(true);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-samurai-600 text-white text-xs font-bold"
              >
                Create Main Branch
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Batches (With Full Edit & Delete Support) */}
      {activeTab === 'batches' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Training Batches ({batches.length})
              </h3>
              <p className="text-xs text-gray-400">
                Click <strong>"Edit Batch"</strong> on any batch to update its name, training days, schedule timings, or capacity.
              </p>
            </div>
            <button
              onClick={handleOpenCreateBatch}
              className="px-4 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-samurai-600/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add New Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {batches.map(b => (
              <div
                key={b._id}
                className="p-5 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:border-samurai-500/30 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-samurai-500/10 text-samurai-600 dark:text-samurai-400 border border-samurai-500/20">
                      {Array.isArray(b.days) ? b.days.join(' • ') : (b.days || 'Mon, Wed, Fri')}
                    </span>
                    <span className="text-xs font-bold text-emerald-500">Active</span>
                  </div>

                  <h4 className="font-black text-base text-gray-900 dark:text-white">
                    {b.name}
                  </h4>

                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <p className="flex items-center gap-1.5 font-mono text-samurai-600 dark:text-samurai-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {b.startTime} - {b.endTime}
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      Capacity: {b.capacity || 30} students max
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditBatch(b)}
                    className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Batch
                  </button>

                  <button
                    onClick={() => handleDeleteBatch(b)}
                    className="p-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white text-xs transition-all"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Instructors */}
      {activeTab === 'instructors' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Dojo Instructors ({instructors.length})</h3>
            <button
              onClick={() => {
                setInstructorForm({ name: '', phone: '', email: '', specialization: '', branch: branches[0]?._id || '' });
                setIsInstructorModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Instructor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {instructors.map(inst => (
              <div key={inst._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-200 dark:border-gray-800">
                <div className="w-10 h-10 rounded-xl bg-samurai-600/10 text-samurai-600 flex items-center justify-center font-bold text-sm mb-2">
                  {inst.name.charAt(0)}
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">{inst.name}</h4>
                <p className="text-xs text-gold-500 font-medium">{inst.specialization}</p>
                <p className="text-xs text-gray-400 mt-1">{inst.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Staff Users */}
      {activeTab === 'staff' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Authorized Staff & Admin Users</h3>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Staff User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffUsers.map(u => (
              <div key={u._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-dojo-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-samurai-500/10 text-samurai-600">
                    {u.role}
                  </span>
                  <span className="text-xs text-emerald-500 font-bold">Active</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mt-2">{u.name}</h4>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-dojo-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">System Audit Trail</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            {auditLogs.map(log => (
              <div key={log._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-samurai-600 dark:text-samurai-400 mr-2">
                    [{log.action}]
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    Target: {log.targetType} ({log.targetId?.slice(-6)})
                  </span>
                </div>
                <span className="text-gray-400 font-mono">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit/Create Branch Modal */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Create Academy Branch'}
      >
        <form onSubmit={handleBranchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Branch Facility Name *</label>
            <input
              required
              type="text"
              value={branchForm.name}
              onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Branch Code (3-4 Letters) *</label>
              <input
                required
                type="text"
                value={branchForm.code}
                onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm uppercase focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                value={branchForm.phone}
                onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Address</label>
            <input
              type="text"
              value={branchForm.address}
              onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={branchForm.email}
              onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBranchModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBranch}
              className="px-5 py-2 rounded-xl bg-samurai-600 text-white font-bold text-xs shadow-md"
            >
              {submittingBranch ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit / Add Batch Modal */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Add Training Batch'}
      >
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Batch Name *</label>
            <input
              required
              type="text"
              value={batchForm.name}
              onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
              placeholder="e.g. Morning Warriors (Karate & Conditioning)"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Training Days (e.g. Mon, Wed, Fri)</label>
            <input
              type="text"
              value={batchForm.days}
              onChange={e => setBatchForm({ ...batchForm, days: e.target.value })}
              placeholder="Mon, Wed, Fri"
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-0.5">Separate days with commas (e.g. Mon, Tue, Thu, Sat)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Start Time</label>
              <input
                type="text"
                value={batchForm.startTime}
                onChange={e => setBatchForm({ ...batchForm, startTime: e.target.value })}
                placeholder="06:00 AM"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">End Time</label>
              <input
                type="text"
                value={batchForm.endTime}
                onChange={e => setBatchForm({ ...batchForm, endTime: e.target.value })}
                placeholder="07:30 AM"
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Maximum Student Capacity</label>
            <input
              type="number"
              min="1"
              value={batchForm.capacity}
              onChange={e => setBatchForm({ ...batchForm, capacity: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:ring-2 focus:ring-samurai-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-dojo-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingBatch}
              className="px-5 py-2 rounded-xl bg-samurai-600 hover:bg-samurai-700 text-white font-bold text-xs shadow-md"
            >
              {submittingBatch ? 'Saving...' : editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Instructor Modal */}
      <Modal isOpen={isInstructorModalOpen} onClose={() => setIsInstructorModalOpen(false)} title="Add Instructor">
        <form onSubmit={handleCreateInstructor} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Instructor Name</label>
            <input required type="text" value={instructorForm.name} onChange={e => setInstructorForm({ ...instructorForm, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Specialization / Belt Rank</label>
            <input required type="text" value={instructorForm.specialization} onChange={e => setInstructorForm({ ...instructorForm, specialization: e.target.value })} placeholder="e.g. Shotokan Karate 4th Dan" className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
              <input type="text" value={instructorForm.phone} onChange={e => setInstructorForm({ ...instructorForm, phone: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <input type="email" value={instructorForm.email} onChange={e => setInstructorForm({ ...instructorForm, email: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-5 py-2 rounded-xl bg-samurai-600 text-white font-bold text-xs shadow-md">Create Instructor</button>
          </div>
        </form>
      </Modal>

      {/* Register Staff Modal */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Register Staff User">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Staff Name</label>
            <input required type="text" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <input required type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
              <input required type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dojo-900 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-5 py-2 rounded-xl bg-samurai-600 text-white font-bold text-xs shadow-md">Register Staff</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
