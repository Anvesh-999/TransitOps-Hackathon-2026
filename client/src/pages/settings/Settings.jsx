// TODO: Dev 1 — Complete Settings page (Admin only)
import { Settings as SettingsIcon, Users, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService } from '../../services/admin.service';
import { formatDate } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    userService.getAll({ limit: 50 }).then((res) => {
      setUsers(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.role?.name || '—'}</td>
                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[u.status]}`}>{u.status}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-700 mb-2">Role Management</h2>
          <p className="text-gray-500 text-sm">Roles are pre-configured: Admin, FleetManager, Driver, SafetyOfficer, FinancialAnalyst.</p>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input type="text" defaultValue="TransitOps" className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input type="text" defaultValue="Asia/Kolkata" className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Save Settings</button>
        </div>
      )}
    </div>
  );
};

export default Settings;
