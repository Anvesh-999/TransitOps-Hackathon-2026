import { useState, useEffect } from 'react';
import { driverService } from '../../services/driver.service';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Edit3, Trash2, Search } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { DRIVER_STATUSES, LICENSE_CATEGORIES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const DriverList = () => {
  const { can } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('All');
  const [licenseCategoryFilter, setLicenseCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals & Dialogs
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'LMV',
    licenseExpiryDate: '',
    contactNumber: '',
    safetyScore: 90,
    status: 'Available',
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (licenseCategoryFilter !== 'All') params.licenseCategory = licenseCategoryFilter;
      if (search) params.search = search;

      const res = await driverService.getAll(params);
      setDrivers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, statusFilter, licenseCategoryFilter, search]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingDriver(null);
    setForm({
      name: '',
      licenseNumber: '',
      licenseCategory: 'LMV',
      licenseExpiryDate: '',
      contactNumber: '',
      safetyScore: 90,
      status: 'Available',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDriver(d);
    // Format date string to YYYY-MM-DD for date input
    const formattedDate = d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString().split('T')[0] : '';
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiryDate: formattedDate,
      contactNumber: d.contactNumber,
      safetyScore: d.safetyScore,
      status: d.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDriver) {
        await driverService.update(editingDriver._id, form);
        showToast('Driver updated successfully');
      } else {
        await driverService.create(form);
        showToast('Driver added successfully');
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save driver', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await driverService.remove(showDeleteDialog._id);
      showToast('Driver deleted successfully');
      setShowDeleteDialog(null);
      fetchDrivers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete driver', 'error');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await driverService.updateStatus(id, newStatus);
      showToast(`Driver status updated to ${newStatus}`);
      fetchDrivers();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
          message.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage personnel, licenses, expiry tracking, and driver safety scores</p>
        </div>
        {can('drivers:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4.5 h-4.5" /> Add Driver
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['All', ...DRIVER_STATUSES].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search & License filter */}
          <div className="flex w-full md:w-auto gap-3 items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or license..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <select
              value={licenseCategoryFilter}
              onChange={(e) => { setLicenseCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="All">All Licenses</option>
              {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No drivers found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">License #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">License Expiry</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Safety Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drivers.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{d.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{d.licenseNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{d.licenseCategory}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{d.contactNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                      d.isLicenseExpired ? 'bg-red-50 text-red-700' :
                      d.isLicenseExpiringSoon ? 'bg-amber-50 text-amber-700' :
                      'text-gray-700'
                    }`}>
                      {formatDate(d.licenseExpiryDate)}
                      {d.isLicenseExpired && ' ⚠️ Expired'}
                      {d.isLicenseExpiringSoon && ' ⏰ Expiring'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 w-8">{d.safetyScore}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getSafetyScoreColor(d.safetyScore)}`}
                          style={{ width: `${d.safetyScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {can('drivers:update') ? (
                      <select
                        value={d.status}
                        onChange={(e) => handleStatusChange(d._id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2.5 py-1.5 focus:outline-none border-none cursor-pointer bg-opacity-10 ${
                          d.status === 'Available' ? 'bg-green-100 text-green-800' :
                          d.status === 'On Trip' ? 'bg-blue-100 text-blue-800' :
                          d.status === 'Off Duty' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {DRIVER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={d.status} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1.5">
                      {can('drivers:update') && (
                        <button onClick={() => handleOpenEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                          <Edit3 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      {can('drivers:delete') && (
                        <button onClick={() => setShowDeleteDialog(d)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDriver ? 'Edit Driver' : 'Add Driver'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                required
                disabled={!!editingDriver}
                placeholder="e.g. DL12345678"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={form.licenseExpiryDate}
                onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safety Score</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              type="text"
              required
              placeholder="e.g. +91 98765 43210"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : editingDriver ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onCancel={() => setShowDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Driver?"
        message={`Are you sure you want to delete driver ${showDeleteDialog?.name}? This will fail if the driver has active trip history (suspend instead).`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default DriverList;
