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
  const limit = 15;

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
          <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
          <p className="text-sm text-gray-500 mt-1">Track fuel purchases, liter volumes, costs, and vehicle mileage logs</p>
        </div>
        {can('fuel-logs:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4.5 h-4.5" /> Add Fuel Log
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Liters (Page)</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalLiters.toLocaleString()} L</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <span className="text-xl font-bold">₹</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Cost (Page)</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalCostValue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <span className="text-sm font-bold">₹/L</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Avg. Cost / Liter</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">₹{averageCostPerLiter}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Dropdown Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Filter Vehicle</label>
            <select
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="All">All Vehicles</option>
              {logs.map((l) => l.vehicleId).filter((v, idx, self) => v && self.findIndex(t => t._id === v._id) === idx).map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No logs found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Liters</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost / Liter</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Odometer (km)</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((l) => (
                <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{l.vehicleId?.registrationNumber || '—'}</div>
                    <div className="text-xs text-gray-500">{l.vehicleId?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{l.liters.toLocaleString()} L</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(l.costPerLiter)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">{formatCurrency(l.totalCost)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{l.odometerKm?.toLocaleString() || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(l.date)}</td>
                  <td className="px-6 py-4 text-right">
                    {can('fuel-logs:delete') && (
                      <button
                        onClick={() => setShowDeleteDialog(l)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Log"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add Fuel Log Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fuel Purchase" maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} — {v.name} (Odometer: {v.odometerKm} km)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liters</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.01"
                placeholder="e.g. 45"
                value={form.liters}
                onChange={(e) => handleLitersOrCostChange(e.target.value, form.costPerLiter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost / Liter (INR)</label>
              <input
                type="number"
                required
                min="0.1"
                step="0.01"
                placeholder="e.g. 96.50"
                value={form.costPerLiter}
                onChange={(e) => handleLitersOrCostChange(form.liters, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (Auto)</label>
              <input
                type="number"
                disabled
                placeholder="0.00"
                value={form.totalCost}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 45200"
                value={form.odometerKm}
                onChange={(e) => setForm({ ...form, odometerKm: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50">
              {saving ? 'Logging...' : 'Log Purchase'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
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
