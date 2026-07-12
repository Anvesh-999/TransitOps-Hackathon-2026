import { useState, useEffect } from 'react';
import { driverService } from '../../services/driver.service';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Edit3, Trash2, Search, LayoutGrid, List, Phone, ShieldCheck, CalendarRange } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { DRIVER_STATUSES, LICENSE_CATEGORIES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const DriverList = () => {
  const { can } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12; // Matches grid columns

  // View state & filters
  const [viewMode, setViewMode] = useState('list');
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
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-505';
    return 'bg-rose-500';
  };

  const getSafetyScoreTextClass = (score) => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-450';
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Drivers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage personnel, compliance expiry tracking, and safety metrics</p>
        </div>
        {can('drivers:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Driver
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full xl:w-auto overflow-x-auto border border-slate-200/10">
            {['All', ...DRIVER_STATUSES].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search, Select, & Grid/List View switch */}
          <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name or license..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-800 dark:text-slate-250 placeholder-slate-450"
              />
            </div>

            {/* Category Select */}
            <select
              value={licenseCategoryFilter}
              onChange={(e) => { setLicenseCategoryFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-255 bg-white"
            >
              <option value="All">All Licenses</option>
              {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/20 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No drivers found</p>
          <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List Mode - Modernized Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">License #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">License Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Safety Score</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350 tracking-wider font-mono">{d.licenseNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{d.licenseCategory}</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{d.contactNumber}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                        d.isLicenseExpired ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                        d.isLicenseExpiringSoon ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                        'text-slate-700 dark:text-slate-400'
                      }`}>
                        {formatDate(d.licenseExpiryDate)}
                        {d.isLicenseExpired && ' ⚠️ Expired'}
                        {d.isLicenseExpiringSoon && ' ⏰ Expiring'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold w-8 ${getSafetyScoreTextClass(d.safetyScore)}`}>{d.safetyScore}%</span>
                        <div className="w-20 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getSafetyScoreColor(d.safetyScore)}`}
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
                          className={`text-xs font-bold rounded-full px-2.5 py-1.5 focus:outline-none border-none cursor-pointer bg-opacity-10 dark:bg-slate-800 ${
                            d.status === 'Available' ? 'bg-green-100 text-green-800 dark:text-green-400' :
                            d.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:text-blue-400' :
                            d.status === 'Off Duty' ? 'bg-amber-100 text-amber-800 dark:text-amber-400' :
                            'bg-red-100 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {DRIVER_STATUSES.map((status) => (
                            <option key={status} value={status} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">{status}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={d.status} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {can('drivers:update') && (
                          <button onClick={() => handleOpenEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {can('drivers:delete') && (
                          <button onClick={() => setShowDeleteDialog(d)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Mode - Beautiful Visual Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {drivers.map((d) => (
            <div
              key={d._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/10">
                    {d.licenseCategory}
                  </span>
                  {can('drivers:update') ? (
                    <select
                      value={d.status}
                      onChange={(e) => handleStatusChange(d._id, e.target.value)}
                      className={`text-[10px] font-bold rounded-full px-2.5 py-1 focus:outline-none border-none cursor-pointer bg-opacity-10 dark:bg-slate-800 ${
                        d.status === 'Available' ? 'bg-green-100 text-green-800 dark:text-green-400' :
                        d.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:text-blue-400' :
                        d.status === 'Off Duty' ? 'bg-amber-100 text-amber-800 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {DRIVER_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">{status}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={d.status} />
                  )}
                </div>

                {/* Profile Avatar & Details */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/10">
                    {d.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate w-36">{d.name}</h3>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400 font-mono tracking-wider">{d.licenseNumber}</p>
                  </div>
                </div>

                {/* COMPLIANCE EXPIRATION ALERTS */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-450 dark:text-slate-400">
                    <span className="font-semibold flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> Expiry</span>
                    <span className={`font-bold ${
                      d.isLicenseExpired ? 'text-rose-600 dark:text-rose-400' :
                      d.isLicenseExpiringSoon ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-655 dark:text-slate-400'
                    }`}>{formatDate(d.licenseExpiryDate)}</span>
                  </div>
                  {/* Small progress meter representing score */}
                  <div className="flex justify-between text-[11px] text-slate-450 dark:text-slate-400 pt-1">
                    <span className="font-semibold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Safety Compliance</span>
                    <span className={`font-bold ${getSafetyScoreTextClass(d.safetyScore)}`}>{d.safetyScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getSafetyScoreColor(d.safetyScore)}`}
                      style={{ width: `${d.safetyScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {d.contactNumber}</p>
                <div className="flex gap-1">
                  {can('drivers:update') && (
                    <button onClick={() => handleOpenEdit(d)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 border border-slate-200/10 transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {can('drivers:delete') && (
                    <button onClick={() => setShowDeleteDialog(d)} className="p-2 rounded-xl bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 border border-rose-200/10 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDriver ? 'Edit Driver' : 'Add Driver'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">License Number</label>
              <input
                type="text"
                required
                disabled={!!editingDriver}
                placeholder="e.g. DL12345678"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Category</label>
              <select
                value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {LICENSE_CATEGORIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={form.licenseExpiryDate}
                onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Safety Score</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Contact Number</label>
            <input
              type="text"
              required
              placeholder="e.g. +91 98765 43210"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingDriver ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
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
