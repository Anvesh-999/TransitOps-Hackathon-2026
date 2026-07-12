import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, Plus, Edit3, Key, Power } from 'lucide-react';
import { userService } from '../../services/admin.service';
import { Modal, ConfirmDialog } from '../../components/common';
import { formatDate } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';
import api from '../../services/api';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [showToggleDialog, setShowToggleDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', phone: '' });
  const [resetPassword, setResetPasswordValue] = useState('');

  // Settings form
  const [orgName, setOrgName] = useState('TransitOps');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getAll({ limit: 50 }),
        api.get('/roles'),
      ]);
      setUsers(usersRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: roles[0]?._id || '', phone: '' });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role?._id || user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const updateData = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        await userService.update(editingUser._id, updateData);
        showMessage('User updated successfully');
      } else {
        await userService.create({ ...form });
        showMessage('User created successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showMessage(err.response?.data?.error?.message || 'Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetPassword.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/users/${resetUserId}/reset-password`, { newPassword: resetPassword });
      showMessage('Password reset successfully');
      setShowResetModal(false);
      setResetPasswordValue('');
    } catch (err) {
      showMessage(err.response?.data?.error?.message || 'Failed to reset password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const user = showToggleDialog;
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    try {
      await userService.update(user._id, { status: newStatus });
      showMessage(`User ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
      setShowToggleDialog(null);
      fetchData();
    } catch (err) {
      showMessage('Failed to update status', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in border ${
          message.type === 'error'
            ? 'bg-red-650 border-red-500 text-white'
            : 'bg-emerald-600 border-emerald-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>

      {/* Tabs Layout */}
      <div className="flex bg-slate-100 dark:bg-slate-955 p-1 rounded-xl w-full sm:w-fit border border-slate-200/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Users Tab ─── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateUser}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-655 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-black">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-955/20 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">{u.role?.name || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            u.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                          }`}>{u.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleEditUser(u)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" title="Edit User">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setResetUserId(u._id); setShowResetModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" title="Reset Password">
                              <Key className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowToggleDialog(u)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title={u.status === 'active' ? 'Disable' : 'Enable'}>
                              <Power className={`w-4 h-4 ${u.status === 'active' ? 'text-green-500' : 'text-red-505'}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Roles Tab ─── */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role._id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100/10 dark:bg-indigo-950/20 rounded-xl flex items-center justify-center border border-indigo-200/10">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{role.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions?.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 rounded text-[11px] font-semibold font-mono border border-slate-200/10">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── General Settings Tab ─── */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 max-w-lg space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Organization Name</label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Default System Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="Asia/Kolkata" className="bg-white dark:bg-slate-900">Asia/Kolkata (IST)</option>
              <option value="America/New_York" className="bg-white dark:bg-slate-900">America/New_York (EST)</option>
              <option value="Europe/London" className="bg-white dark:bg-slate-900">Europe/London (GMT)</option>
              <option value="Asia/Tokyo" className="bg-white dark:bg-slate-900">Asia/Tokyo (JST)</option>
            </select>
          </div>
          <button
            onClick={() => showMessage('Settings saved')}
            className="bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
          >
            Save Settings
          </button>
        </div>
      )}

      {/* ─── Create/Edit User Modal ─── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Create User'} maxWidth="max-w-md">
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Full Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="john@transitops.com" />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Min 8 characters" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Role</label>
            <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
              <option value="" className="bg-white dark:bg-slate-900">Select Role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id} className="bg-white dark:bg-slate-900">{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Phone (optional)</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="+91 98765 43210" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Reset Password Modal ─── */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Reset Password" maxWidth="max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">New Password</label>
            <input type="password" minLength={8} value={resetPassword} onChange={(e) => setResetPasswordValue(e.target.value)} className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Min 8 characters" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={handleResetPassword} disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all">
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Toggle Status Dialog ─── */}
      <ConfirmDialog
        isOpen={!!showToggleDialog}
        onCancel={() => setShowToggleDialog(null)}
        onConfirm={handleToggleStatus}
        title={showToggleDialog?.status === 'active' ? 'Disable User?' : 'Enable User?'}
        message={`Are you sure you want to ${showToggleDialog?.status === 'active' ? 'disable' : 'enable'} ${showToggleDialog?.name}?`}
        confirmText={showToggleDialog?.status === 'active' ? 'Disable' : 'Enable'}
        variant={showToggleDialog?.status === 'active' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default Settings;
