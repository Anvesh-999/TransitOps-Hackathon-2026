import { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';
import { vehicleService } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { Wrench, Plus, Check } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { MAINTENANCE_TYPES, STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

const MaintenanceList = () => {
  const { can } = useAuth();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12; // Standardised page limits

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Dialogs
  const [showModal, setShowModal] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'Scheduled',
    description: '',
    cost: '',
    startDate: '',
    expectedEndDate: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await maintenanceService.getAll(params);
      setRecords(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch maintenance records', 'error');
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
    fetchRecords();
  }, [page, statusFilter]);

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
      type: 'Scheduled',
      description: '',
      cost: '',
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await maintenanceService.create(form);
      showToast('Maintenance record created successfully');
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to create record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await maintenanceService.close(showCloseDialog._id, today);
      showToast('Maintenance record closed. Vehicle is now Available.');
      setShowCloseDialog(null);
      fetchRecords();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to close record', 'error');
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Maintenance Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule service, track vehicle repair logs, and close open work orders</p>
        </div>
        {can('maintenance:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> New Record
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto overflow-x-auto border border-slate-200/10">
          {['All', 'Open', 'Closed'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Wrench className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No records found</p>
              <p className="text-sm text-slate-450 dark:text-slate-550 mt-1">Maintenance logs will appear here upon logging</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Estimated Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Expected End</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{r.vehicleId?.registrationNumber || '—'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">{r.vehicleId?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded text-xs font-semibold">{r.type}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-750 dark:text-slate-355 max-w-xs truncate" title={r.description}>{r.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{formatCurrency(r.cost)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(r.startDate)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(r.expectedEndDate)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === 'Open' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                        'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {r.status === 'Open' && can('maintenance:update') && (
                          <button
                            onClick={() => setShowCloseDialog(r)}
                            className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-955/20 hover:bg-green-100 px-3 py-1.5 rounded-xl border border-green-250/10 transition-colors"
                            title="Complete & Close"
                          >
                            <Check className="w-3.5 h-3.5" /> Close
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
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* New Maintenance Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Maintenance Work Order" maxWidth="max-w-md">
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
                  {v.registrationNumber} — {v.name} ({v.status})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {MAINTENANCE_TYPES.map((t) => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Estimated Cost (INR)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="Estimated cost"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Expected End Date</label>
              <input
                type="date"
                required
                value={form.expectedEndDate}
                onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Description / Notes</label>
            <textarea
              required
              rows="3"
              placeholder="Provide details about the issue or required service..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Maintenance Confirmation */}
      <ConfirmDialog
        isOpen={!!showCloseDialog}
        onCancel={() => setShowCloseDialog(null)}
        onConfirm={handleCloseRecord}
        title="Complete and Close Order?"
        message={`Are you sure you want to close the work order for vehicle ${showCloseDialog?.vehicleId?.registrationNumber}? Doing so will change the vehicle status back to 'Available'.`}
        confirmText="Complete & Close"
        variant="primary"
      />
    </div>
  );
};

export default MaintenanceList;
