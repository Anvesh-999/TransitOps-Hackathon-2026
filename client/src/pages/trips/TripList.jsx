import { useState, useEffect } from 'react';
import { tripService } from '../../services/trip.service';
import { vehicleService } from '../../services/vehicle.service';
import { driverService } from '../../services/driver.service';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Plus, Send, CheckCircle, XCircle, AlertTriangle, List, GitCommit, FileText, ArrowRight, DollarSign, Calendar, Truck, User, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { TRIP_STATUSES } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

const TripList = () => {
  const { can } = useAuth();
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12; // Adjusted for responsive grid layouts

  // Views & Filters
  const [viewMode, setViewMode] = useState('list');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Action Dialogs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(null);
  const [showDispatchDialog, setShowDispatchDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Multi-step Create Form State
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    plannedDistanceKm: '',
    vehicleId: '',
    driverId: '',
    cargoWeightKg: '',
    revenue: '',
  });

  // Complete Form State
  const [completeForm, setCompleteForm] = useState({
    finalOdometerKm: '',
    fuelConsumedLiters: '',
  });

  // Cancel Reason State
  const [cancelReason, setCancelReason] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await tripService.getAll(params);
      setTrips(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch trips', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableResources = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAll({ status: 'Available', limit: 100 }),
        driverService.getAll({ status: 'Available', limit: 100 }),
      ]);
      setAvailableVehicles(vRes.data.data);
      setAvailableDrivers(dRes.data.data.filter((d) => !d.isLicenseExpired));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page, statusFilter]);

  useEffect(() => {
    if (showCreateModal) {
      fetchAvailableResources();
    }
  }, [showCreateModal]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setStep(1);
    setForm({
      source: '',
      destination: '',
      plannedDistanceKm: '',
      vehicleId: '',
      driverId: '',
      cargoWeightKg: '',
      revenue: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tripService.create(form);
      showToast('Trip created successfully as Draft');
      setShowCreateModal(false);
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to create trip', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async () => {
    try {
      await tripService.dispatch(showDispatchDialog._id);
      showToast('Trip dispatched successfully. Vehicle and Driver set to On Trip.');
      setShowDispatchDialog(null);
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to dispatch trip', 'error');
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tripService.complete(showCompleteModal._id, completeForm);
      showToast('Trip completed. Vehicle and Driver returned to Available.');
      setShowCompleteModal(null);
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to complete trip', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      showToast('Cancellation reason is required', 'error');
      return;
    }
    try {
      await tripService.cancel(showCancelDialog._id, cancelReason);
      showToast('Trip cancelled. Vehicle and Driver status reset.');
      setShowCancelDialog(null);
      setCancelReason('');
      fetchTrips();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to cancel trip', 'error');
    }
  };

  const selectedVehicleObj = availableVehicles.find((v) => v._id === form.vehicleId);
  const exceedsCapacity = selectedVehicleObj && Number(form.cargoWeightKg) > selectedVehicleObj.maxLoadCapacityKg;

  // ── Render Timeline Steps indicator on card ──
  const renderStepIndicator = (status) => {
    const stepsList = ['Draft', 'Dispatched', 'Completed'];
    if (status === 'Cancelled') {
      return (
        <div className="flex items-center gap-1 text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-955/20 px-2 py-1 rounded-lg border border-rose-250/10">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </div>
      );
    }

    const currentIdx = stepsList.indexOf(status);

    return (
      <div className="flex items-center gap-1.5 w-full max-w-[280px]">
        {stepsList.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isActive = idx === currentIdx;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                } ${isActive ? 'ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                title={step}
              >
                {idx + 1}
              </div>
              {idx < stepsList.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-all mx-1 ${
                    idx < currentIdx ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    );
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
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Trips & Dispatch</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor routes, dispatch drivers, and log fuel/mileage analytics</p>
        </div>
        {can('trips:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> New Trip
          </button>
        )}
      </div>

      {/* Filters & View Toggles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full md:w-auto overflow-x-auto border border-slate-200/10">
          {['All', ...TRIP_STATUSES].map((status) => (
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

        {/* Layout Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/20 w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-655'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-655'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" /> Roadmap
          </button>
          <button
            type="button"
            onClick={() => setViewMode('telemetry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'telemetry'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-655'
            }`}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry
          </button>
        </div>
      </div>

      {/* Content Container */}
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <MapPin className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-750 dark:text-slate-355">No trips found</p>
          <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Dispatches appear when trips are logged</p>
        </div>
      ) : viewMode === 'list' ? (
        /* List Mode - Modernized Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Cargo & Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {trips.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.destination}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-450 font-medium mt-0.5">{t.plannedDistanceKm} km</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{t.vehicleId?.registrationNumber || '—'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">{t.vehicleId?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {t.driverId?.name && (
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-[9px] font-bold flex items-center justify-center">
                            {t.driverId.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{t.driverId?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-bold text-slate-900 dark:text-white">{t.cargoWeightKg.toLocaleString()} kg</div>
                      <div className="text-xs text-slate-500 dark:text-slate-450 font-bold mt-0.5">{formatCurrency(t.revenue)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {t.status === 'Draft' && can('trips:update') && (
                          <>
                            <button
                              onClick={() => setShowDispatchDialog(t)}
                              className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-250/10 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" /> Dispatch
                            </button>
                            <button
                              onClick={() => setShowCancelDialog(t)}
                              className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-250/10 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}
                        {t.status === 'Dispatched' && can('trips:update') && (
                          <>
                            <button
                              onClick={() => {
                                setShowCompleteModal(t);
                                setCompleteForm({
                                  finalOdometerKm: (t.vehicleId?.odometerKm || 0) + t.plannedDistanceKm,
                                  fuelConsumedLiters: '',
                                });
                              }}
                              className="flex items-center gap-1 text-xs font-bold text-blue-650 bg-blue-50 dark:bg-blue-955/20 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/10 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Complete
                            </button>
                            <button
                              onClick={() => setShowCancelDialog(t)}
                              className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-250/10 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline Mode - Horizontal Roadmap Tracker */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {trips.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                      {t.source}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      {t.destination}
                    </span>
                  </div>
                  {renderStepIndicator(t.status)}
                </div>

                {/* TRIP CARD VEHICLE & DRIVER METRICS */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-start gap-2.5">
                    <Truck className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Vehicle</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-32">{t.vehicleId?.registrationNumber || '—'}</p>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">{t.vehicleId?.name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Driver</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-32">{t.driverId?.name || '—'}</p>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">{t.driverId?.licenseCategory ? `License: ${t.driverId.licenseCategory}` : '—'}</p>
                    </div>
                  </div>
                </div>

                {/* FINANCIAL DETAILS */}
                <div className="grid grid-cols-2 gap-3 mt-3.5 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/10">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cargo weight</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-350">{t.cargoWeightKg.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gross revenue</span>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(t.revenue)}</p>
                  </div>
                </div>
              </div>

              {/* CARD OPERATIONS BUTTONS */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(t.createdAt)}
                </div>

                <div className="flex gap-1.5">
                  {t.status === 'Draft' && can('trips:update') && (
                    <>
                      <button
                        onClick={() => setShowDispatchDialog(t)}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-250/10 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Dispatch
                      </button>
                      <button
                        onClick={() => setShowCancelDialog(t)}
                        className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-250/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {t.status === 'Dispatched' && can('trips:update') && (
                    <>
                      <button
                        onClick={() => {
                          setShowCompleteModal(t);
                          setCompleteForm({
                            finalOdometerKm: (t.vehicleId?.odometerKm || 0) + t.plannedDistanceKm,
                            fuelConsumedLiters: '',
                          });
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-blue-650 bg-blue-50 dark:bg-blue-955/20 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-200/10 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Complete
                      </button>
                      <button
                        onClick={() => setShowCancelDialog(t)}
                        className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-250/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TelemetryConsole trips={trips} fetchTrips={fetchTrips} showToast={showToast} can={can} />
      )}

      {/* Pagination */}
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Multi-Step Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Dispatch Request" maxWidth="max-w-md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Step 1: Route & Distance */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1: Route Details</span>
                <span className="text-xs text-slate-400 font-bold">1 / 4</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Source / Pickup Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Hub"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Destination / Drop Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Port"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Planned Distance (km)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 150"
                  value={form.plannedDistanceKm}
                  onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.source || !form.destination || !form.plannedDistanceKm}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Vehicle */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2: Assign Vehicle</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 dark:text-slate-400 font-bold hover:underline">Back</button>
                  <span className="text-xs text-slate-400 font-bold">2 / 4</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Select Available Vehicle</label>
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Choose a vehicle...</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900">
                      {v.registrationNumber} — {v.name} ({v.type})
                    </option>
                  ))}
                </select>
                {selectedVehicleObj && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200/10">
                    Vehicle Type: <span className="font-semibold">{selectedVehicleObj.type}</span> • Capacity: <span className="font-semibold">{selectedVehicleObj.maxLoadCapacityKg.toLocaleString()} kg</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.vehicleId}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Driver */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3: Assign Driver</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(2)} className="text-xs text-slate-500 dark:text-slate-400 font-bold hover:underline">Back</button>
                  <span className="text-xs text-slate-400 font-bold">3 / 4</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Select Available Driver</label>
                <select
                  required
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Choose a driver...</option>
                  {availableDrivers.map((d) => (
                    <option key={d._id} value={d._id} className="bg-white dark:bg-slate-900">
                      {d.name} — License: {d.licenseCategory} (Score: {d.safetyScore})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  disabled={!form.driverId}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Cargo & Financials */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 4: Cargo & Financials</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setStep(3)} className="text-xs text-slate-500 dark:text-slate-400 font-bold hover:underline">Back</button>
                  <span className="text-xs text-slate-400 font-bold">4 / 4</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Cargo Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 4000"
                  value={form.cargoWeightKg}
                  onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
                  className={`w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${
                    exceedsCapacity ? 'border-red-500 text-red-500 dark:border-red-700' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                  }`}
                />
                {exceedsCapacity && (
                  <p className="text-xs text-red-650 dark:text-red-400 mt-1.5 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Exceeds vehicle load capacity ({selectedVehicleObj.maxLoadCapacityKg.toLocaleString()} kg)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Trip Revenue (INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 50000"
                  value={form.revenue}
                  onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={saving || exceedsCapacity}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all animate-glow-pulse"
                >
                  {saving ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={!!showCompleteModal} onClose={() => setShowCompleteModal(null)} title="Complete Trip Metrics" maxWidth="max-w-sm">
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Final Odometer Reading (km)</label>
            <input
              type="number"
              required
              min={showCompleteModal?.vehicleId?.odometerKm || 0}
              placeholder="e.g. 45150"
              value={completeForm.finalOdometerKm}
              onChange={(e) => setCompleteForm({ ...completeForm, finalOdometerKm: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <p className="text-xs text-slate-450 dark:text-slate-450 mt-1.5 font-medium">Starting Odometer: {showCompleteModal?.vehicleId?.odometerKm?.toLocaleString()} km</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Fuel Consumed (Liters)</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 35"
              value={completeForm.fuelConsumedLiters}
              onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedLiters: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCompleteModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Completing...' : 'Log & Complete'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Confirmation */}
      <ConfirmDialog
        isOpen={!!showDispatchDialog}
        onCancel={() => setShowDispatchDialog(null)}
        onConfirm={handleDispatch}
        title="Dispatch Trip?"
        message={`Are you sure you want to dispatch trip from ${showDispatchDialog?.source} to ${showDispatchDialog?.destination}? This will update the assigned vehicle (${showDispatchDialog?.vehicleId?.registrationNumber}) and driver (${showDispatchDialog?.driverId?.name}) to 'On Trip' status.`}
        confirmText="Confirm Dispatch"
        variant="primary"
      />

      {/* Cancel Request Dialog */}
      <Modal isOpen={!!showCancelDialog} onClose={() => setShowCancelDialog(null)} title="Cancel Trip Dispatch" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-550 dark:text-slate-400 font-medium">Provide a brief reason for cancelling this trip request:</p>
          <div>
            <textarea
              required
              rows="3"
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCancelDialog(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Close</button>
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all"
            >
              Cancel Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const TelemetryConsole = ({ trips, fetchTrips, showToast }) => {
  const dispatchedTrips = trips.filter(t => t.status === 'Dispatched');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [simSpeed, setSimSpeed] = useState(65);
  const [simTemp, setSimTemp] = useState(88);
  const [simFuel, setSimFuel] = useState(94);
  const [triggering, setTriggering] = useState(false);

  // Keep selected trip updated if trips state changes
  useEffect(() => {
    if (selectedTrip) {
      const updated = trips.find(t => t._id === selectedTrip._id);
      if (updated) setSelectedTrip(updated);
    } else if (dispatchedTrips.length > 0) {
      setSelectedTrip(dispatchedTrips[0]);
    }
  }, [trips]);

  // Speed and temperature fluctuations simulation
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedTrip && selectedTrip.status === 'Dispatched') {
        setSimSpeed(prev => {
          const change = Math.floor(Math.random() * 7) - 3;
          const next = prev + change;
          return Math.max(45, Math.min(next, 95));
        });
        setSimTemp(prev => {
          const change = Math.floor(Math.random() * 3) - 1;
          const next = prev + change;
          return Math.max(82, Math.min(next, 99));
        });
        setSimFuel(prev => {
          const next = prev - 0.1;
          return Math.max(5, Number(next.toFixed(1)));
        });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedTrip]);

  const handleTriggerEvent = async (eventType, customValue) => {
    if (!selectedTrip) return;
    setTriggering(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trips/${selectedTrip._id}/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventType,
          value: customValue,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Telemetry event (${eventType}) dispatched to MongoDB!`, 'success');
        if (eventType === 'crash') {
          setSimSpeed(0);
          setSimTemp(120);
        }
        fetchTrips();
      } else {
        showToast(data.error?.message || 'Failed to dispatch alert', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('API network connection failed', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const handleAutoDispatch = async () => {
    const draftTrip = trips.find(t => t.status === 'Draft');
    if (!draftTrip) {
      showToast('No Draft dispatches found to simulate. Create a new trip first!', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trips/${draftTrip._id}/dispatch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        showToast(`Trip ${draftTrip.source} ➔ ${draftTrip.destination} dispatched!`, 'success');
        fetchTrips();
      } else {
        showToast(data.error?.message || 'Failed to dispatch trip', 'error');
      }
    } catch (err) {
      showToast('Failed to dispatch trip', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in pb-10">
      {/* Active Trips List Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
          Active Telemetry Feeds
        </h3>
        
        {dispatchedTrips.length === 0 ? (
          <div className="text-center py-10 space-y-4">
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium leading-relaxed">No active dispatched trips found in MongoDB.</p>
            <button
              onClick={handleAutoDispatch}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-semibold hover:shadow-lg transition-all"
            >
              Auto-Dispatch a Draft Trip
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dispatchedTrips.map(t => (
              <div
                key={t._id}
                onClick={() => setSelectedTrip(t)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTrip?._id === t._id
                    ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/15'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/30'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate w-32">
                    {t.source} ➔ {t.destination}
                  </div>
                  <span className="text-[10px] bg-blue-100/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-455 space-y-0.5 font-medium">
                  <div>Vehicle: {t.vehicleId?.registrationNumber || '—'}</div>
                  <div>Driver: {t.driverId?.name || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GPS Map HUD Simulation */}
      <div className="lg:col-span-2 space-y-6">
        {selectedTrip ? (
          <div className="bg-slate-950 border border-slate-900 rounded-2xl shadow-xl overflow-hidden text-white font-mono flex flex-col justify-between h-full min-h-[480px]">
            {/* Top HUD bar */}
            <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-850 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
                <span className="font-bold tracking-widest text-slate-350">ACTIVE RECEIVER FEED: ON_DUTY</span>
              </div>
              <span className="text-emerald-400 font-bold uppercase">● ONLINE_SECURE</span>
            </div>

            {/* Simulated Live Map Canvas */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-6 h-60 overflow-hidden">
              {/* Radar circular lines */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-[100px] h-[100px] border border-slate-700 rounded-full animate-pulse"></div>
                <div className="w-[240px] h-[240px] border border-slate-800 rounded-full absolute"></div>
                <div className="w-[380px] h-[380px] border border-slate-850 rounded-full absolute"></div>
              </div>

              {/* Indian Highway Simulator Path SVG */}
              <svg viewBox="0 0 400 200" className="w-full max-w-lg opacity-85 z-10">
                <path d="M 50,100 Q 150,40 200,100 T 350,100" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 50,100 Q 150,40 200,100 T 350,100" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="5,5" className="animate-dash" />
                
                {/* Source & Destination */}
                <circle cx="50" cy="100" r="6" fill="#10B981" />
                <circle cx="350" cy="100" r="6" fill="#EF4444" />
                
                {/* Truck marker crawling */}
                <g className="animate-float">
                  <circle cx="200" cy="80" r="9" fill="#3B82F6" className="animate-ping" opacity="0.4" />
                  <circle cx="200" cy="80" r="6" fill="#2563EB" />
                </g>
              </svg>

              {/* Cities Labels */}
              <div className="absolute bottom-4 left-6 text-left">
                <span className="text-[10px] text-slate-500 uppercase">Origin</span>
                <div className="text-xs font-bold text-slate-350">{selectedTrip.source}</div>
              </div>
              <div className="absolute bottom-4 right-6 text-right">
                <span className="text-[10px] text-slate-500 uppercase">Destination</span>
                <div className="text-xs font-bold text-slate-350">{selectedTrip.destination}</div>
              </div>

              {/* Status Banner inside Map */}
              {selectedTrip.status === 'Cancelled' && (
                <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2 z-20">
                  <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce" />
                  <h4 className="text-base font-bold text-white uppercase tracking-widest text-center">COLLISION SHUTDOWN EVENT LOGGED</h4>
                  <p className="text-[11px] text-red-400 font-bold px-6 text-center">{selectedTrip.cancelReason}</p>
                </div>
              )}
            </div>

            {/* Live Data HUD Panel */}
            <div className="p-4 bg-slate-900/95 border-t border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-mono">
              <div className="border-r border-slate-800 pr-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold">TELEMETRY SPEED</div>
                <div className={`text-base font-black ${simSpeed > 80 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                  {simSpeed} km/h
                </div>
              </div>
              <div className="border-r border-slate-800 pr-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold">COOLANT TEMP</div>
                <div className={`text-base font-black ${simTemp > 95 ? 'text-amber-500 animate-pulse' : 'text-emerald-400'}`}>
                  {simTemp} °C
                </div>
              </div>
              <div className="border-r border-slate-800 pr-2">
                <div className="text-[9px] text-slate-500 uppercase font-bold">FUEL LEVEL</div>
                <div className="text-base font-black text-slate-200">
                  {simFuel}%
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase font-bold">SAFETY INDEX</div>
                <div className="text-base font-black text-indigo-400">
                  {selectedTrip.driverId?.safetyScore || 90}/100
                </div>
              </div>
            </div>

            {/* Sim Event Trigger Actions Panel */}
            {selectedTrip.status === 'Dispatched' && (
              <div className="p-4 bg-slate-950 border-t border-slate-850">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2.5 font-bold">
                  Simulate MongoDB Trigger Event Alarms
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    disabled={triggering}
                    onClick={() => handleTriggerEvent('speeding', 92)}
                    className="py-2 bg-red-950/20 hover:bg-red-955/40 text-red-400 border border-red-500/25 text-xs font-semibold rounded-xl transition-all"
                  >
                    Speeding (92 km/h)
                  </button>
                  <button
                    disabled={triggering}
                    onClick={() => handleTriggerEvent('overheating', 104)}
                    className="py-2 bg-amber-955/20 hover:bg-amber-955/40 text-amber-400 border border-amber-500/25 text-xs font-semibold rounded-xl transition-all"
                  >
                    Engine Hot (104°C)
                  </button>
                  <button
                    disabled={triggering}
                    onClick={() => handleTriggerEvent('fatigue', 1)}
                    className="py-2 bg-violet-955/20 hover:bg-violet-955/40 text-violet-400 border border-violet-500/25 text-xs font-semibold rounded-xl transition-all"
                  >
                    Driver Fatigue
                  </button>
                  <button
                    disabled={triggering}
                    onClick={() => handleTriggerEvent('crash', 6.2)}
                    className="py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-900/10"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Collision (6.2G)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-20 text-center text-white flex flex-col items-center justify-center h-full min-h-[480px] font-mono">
            <Cpu className="w-16 h-16 text-slate-800 animate-pulse mb-4" />
            <p className="text-sm font-bold text-slate-400">NO TELEMETRY FEED CONNECTED</p>
            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed text-center">
              Select an active dispatched trip from the left sidebar or auto-dispatch a draft cargo request to connect the tracker console.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;
