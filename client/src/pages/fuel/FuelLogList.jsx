import { useState, useEffect } from 'react';
import { fuelLogService } from '../../services/finance.service';
import { vehicleService } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { Fuel, Plus, Trash2, Calendar, Search } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { formatCurrency, formatDate } from '../../utils/formatters';

const FuelLogList = () => {
  const { can } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filters
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Dialogs
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    vehicleId: '',
    liters: '',
    costPerLiter: '',
    totalCost: '',
    odometerKm: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (vehicleFilter !== 'All') params.vehicleId = vehicleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await fuelLogService.getAll(params);
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch fuel logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await vehicleService.getAll({ limit: 100 });
      setVehicles(res.data.data.filter((v) => v.status !== 'Retired'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, vehicleFilter, startDate, endDate]);

  useEffect(() => {
    if (showModal) {
      fetchVehicles();
    }
  }, [showModal]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setForm({
      vehicleId: '',
      liters: '',
      costPerLiter: '',
      totalCost: '',
      odometerKm: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleLitersOrCostChange = (litersVal, costVal) => {
    const l = Number(litersVal) || 0;
    const c = Number(costVal) || 0;
    const total = l * c;
    setForm((prev) => ({
      ...prev,
      liters: litersVal,
      costPerLiter: costVal,
      totalCost: total > 0 ? total.toFixed(2) : '',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fuelLogService.create(form);
      showToast('Fuel log added successfully');
      setShowModal(false);
      fetchLogs();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to add fuel log', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fuelLogService.remove(showDeleteDialog._id);
      showToast('Fuel log deleted successfully');
      setShowDeleteDialog(null);
      fetchLogs();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete fuel log', 'error');
    }
  };

  // Summaries Calculations
  const totalLiters = logs.reduce((sum, log) => sum + (log.liters || 0), 0);
  const totalCostValue = logs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
  const averageCostPerLiter = totalLiters > 0 ? (totalCostValue / totalLiters).toFixed(2) : 0;

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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Fuel Logbook</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track fuel purchases, liter volumes, costs, and mileage analytics</p>
        </div>
        {can('fuel-logs:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Fuel Log
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-105/10 dark:bg-blue-950/40 border border-blue-200/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-450 dark:text-slate-450 uppercase font-semibold">Total Liters (Page)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalLiters.toLocaleString()} L</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100/10 dark:bg-emerald-950/40 border border-emerald-200/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-450 text-xl font-black">
            <span>₹</span>
          </div>
          <div>
            <p className="text-xs text-slate-455 dark:text-slate-450 uppercase font-semibold">Total Cost (Page)</p>
            <p className="text-2xl font-black text-emerald-605 dark:text-emerald-400 mt-0.5">{formatCurrency(totalCostValue)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100/10 dark:bg-amber-950/40 border border-amber-200/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-450 text-sm font-black">
            <span>₹/L</span>
          </div>
          <div>
            <p className="text-xs text-slate-455 dark:text-slate-450 uppercase font-semibold">Avg. Cost / Liter</p>
            <p className="text-2xl font-black text-amber-605 dark:text-amber-400 mt-0.5">₹{averageCostPerLiter}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Dropdown Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wider">Filter Vehicle</label>
            <select
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
            >
              <option value="All">All Vehicles</option>
              {logs.map((l) => l.vehicleId).filter((v, idx, self) => v && self.findIndex(t => t._id === v._id) === idx).map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Fuel className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No logs found</p>
              <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Liters</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Cost / Liter</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Total Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{l.vehicleId?.registrationNumber || '—'}</div>
                      <div className="text-xs text-slate-550 dark:text-slate-450 mt-0.5">{l.vehicleId?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350 font-bold">{l.liters.toLocaleString()} L</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{formatCurrency(l.costPerLiter)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{formatCurrency(l.totalCost)}</td>
                    <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400 font-mono">{l.odometerKm?.toLocaleString() || '—'} km</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(l.date)}</td>
                    <td className="px-6 py-4 text-right">
                      {can('fuel-logs:delete') && (
                        <button
                          onClick={() => setShowDeleteDialog(l)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors"
                          title="Delete Log"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add Fuel Log Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fuel Purchase" maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Select Vehicle</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="" className="bg-white dark:bg-slate-900">Choose a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900">
                  {v.registrationNumber} — {v.name} (Odometer: {v.odometerKm} km)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Liters</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.01"
                placeholder="e.g. 45"
                value={form.liters}
                onChange={(e) => handleLitersOrCostChange(e.target.value, form.costPerLiter)}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Cost / Liter (INR)</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.01"
                placeholder="e.g. 96.50"
                value={form.costPerLiter}
                onChange={(e) => handleLitersOrCostChange(form.liters, e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Total Cost (Auto)</label>
              <input
                type="number"
                disabled
                placeholder="0.00"
                value={form.totalCost}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/20 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Current Odometer (km)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 45200"
                value={form.odometerKm}
                onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Purchase Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Logging...' : 'Log Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onCancel={() => setShowDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Fuel Log?"
        message={`Are you sure you want to delete this purchase of ${showDeleteDialog?.liters} Liters? Doing so will recalculate total costs.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default FuelLogList;
