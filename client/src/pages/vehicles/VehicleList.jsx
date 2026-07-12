import { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { Truck, Plus, Edit3, Trash2, Search, LayoutGrid, List, Navigation, ShieldAlert, Award } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { VEHICLE_TYPES, VEHICLE_STATUSES } from '../../utils/constants';

const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const VehicleList = () => {
  const { can } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12; // 12 fits 2, 3, or 4 columns grid perfectly

  // View Mode & Filters
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals & Dialogs
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    registrationNumber: '',
    name: '',
    type: 'Truck',
    maxLoadCapacityKg: '',
    odometerKm: '',
    acquisitionCost: '',
    region: 'North',
    status: 'Available',
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.type = typeFilter;
      if (search) params.search = search;

      const res = await vehicleService.getAll(params);
      setVehicles(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, statusFilter, typeFilter, search]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setForm({
      registrationNumber: '',
      name: '',
      type: 'Truck',
      maxLoadCapacityKg: '',
      odometerKm: '',
      acquisitionCost: '',
      region: 'North',
      status: 'Available',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setForm({
      registrationNumber: v.registrationNumber,
      name: v.name,
      type: v.type,
      maxLoadCapacityKg: v.maxLoadCapacityKg,
      odometerKm: v.odometerKm,
      acquisitionCost: v.acquisitionCost,
      region: v.region || 'North',
      status: v.status,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle._id, form);
        showToast('Vehicle updated successfully');
      } else {
        await vehicleService.create(form);
        showToast('Vehicle created successfully');
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to save vehicle', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await vehicleService.remove(showDeleteDialog._id);
      showToast('Vehicle deleted successfully');
      setShowDeleteDialog(null);
      fetchVehicles();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete vehicle', 'error');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await vehicleService.updateStatus(id, newStatus);
      showToast(`Vehicle status updated to ${newStatus}`);
      fetchVehicles();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to update status', 'error');
    }
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Vehicles</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage fleet registry, capacity, and active statuses</p>
        </div>
        {can('vehicles:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Vehicle
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full xl:w-auto overflow-x-auto border border-slate-200/10">
            {['All', ...VEHICLE_STATUSES].map((status) => (
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
            {/* Search bar */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reg# or name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-800 dark:text-slate-250 placeholder-slate-450"
              />
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
            >
              <option value="All">All Types</option>
              {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
      ) : vehicles.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Truck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-750 dark:text-slate-300">No vehicles found</p>
          <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List Mode - Modernized Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Reg #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{v.registrationNumber}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350">{v.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{v.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{v.maxLoadCapacityKg.toLocaleString()} kg</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{v.odometerKm.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{v.region || '—'}</td>
                    <td className="px-6 py-4">
                      {can('vehicles:update') ? (
                        <select
                          value={v.status}
                          onChange={(e) => handleStatusChange(v._id, e.target.value)}
                          className={`text-xs font-bold rounded-full px-2.5 py-1.5 focus:outline-none border-none cursor-pointer bg-opacity-10 dark:bg-slate-800 ${
                            v.status === 'Available' ? 'bg-green-100 text-green-800 dark:text-green-400' :
                            v.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:text-blue-400' :
                            v.status === 'In Shop' ? 'bg-amber-100 text-amber-800 dark:text-amber-400' :
                            'bg-red-100 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {VEHICLE_STATUSES.map((status) => (
                            <option key={status} value={status} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">{status}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={v.status} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {can('vehicles:update') && (
                          <button onClick={() => handleOpenEdit(v)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {can('vehicles:delete') && (
                          <button onClick={() => setShowDeleteDialog(v)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors" title="Delete">
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
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/10">
                    {v.type}
                  </span>
                  {can('vehicles:update') ? (
                    <select
                      value={v.status}
                      onChange={(e) => handleStatusChange(v._id, e.target.value)}
                      className={`text-[10px] font-bold rounded-full px-2.5 py-1 focus:outline-none border-none cursor-pointer bg-opacity-10 dark:bg-slate-800 ${
                        v.status === 'Available' ? 'bg-green-100 text-green-800 dark:text-green-400' :
                        v.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:text-blue-400' :
                        v.status === 'In Shop' ? 'bg-amber-100 text-amber-800 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:text-red-400'
                      }`}
                    >
                      {VEHICLE_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white">{status}</option>
                      ))}
                    </select>
                  ) : (
                    <StatusBadge status={v.status} />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{v.name}</h3>
                <p className="text-xs text-slate-450 font-bold dark:text-slate-400 mt-0.5 tracking-wider font-mono">{v.registrationNumber}</p>

                {/* CAPACITY GAUGES */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-450 dark:text-slate-400">
                    <span className="font-semibold">Capacity Log</span>
                    <span className="font-bold">{v.maxLoadCapacityKg.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((v.maxLoadCapacityKg / 16000) * 100, 100)}%` }} // relative to standard max 16000kg
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium space-y-0.5">
                  <p className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-slate-400" /> {v.odometerKm.toLocaleString()} km</p>
                  <p className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-slate-400" /> {v.region || '—'}</p>
                </div>

                <div className="flex gap-1">
                  {can('vehicles:update') && (
                    <button onClick={() => handleOpenEdit(v)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/10 transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {can('vehicles:delete') && (
                    <button onClick={() => setShowDeleteDialog(v)} className="p-2 rounded-xl bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 border border-rose-200/10 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add/Edit Vehicle Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'} maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Registration Number</label>
            <input
              type="text"
              required
              disabled={!!editingVehicle}
              placeholder="e.g. MH12AB1234"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Vehicle Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Truck-01"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {VEHICLE_TYPES.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Region</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {REGIONS.map((r) => <option key={r} value={r} className="bg-white dark:bg-slate-900">{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Capacity (kg)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="5000"
                value={form.maxLoadCapacityKg}
                onChange={(e) => setForm({ ...form, maxLoadCapacityKg: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Odometer (km)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="45000"
                value={form.odometerKm}
                onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Acquisition Cost (INR)</label>
            <input
              type="number"
              required
              min="0"
              placeholder="2500000"
              value={form.acquisitionCost}
              onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingVehicle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onCancel={() => setShowDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle?"
        message={`Are you sure you want to delete vehicle ${showDeleteDialog?.registrationNumber}? This will fail if the vehicle has active trip history (retire instead).`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default VehicleList;
