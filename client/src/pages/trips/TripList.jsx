import { useState, useEffect } from 'react';
import { tripService } from '../../services/trip.service';
import { vehicleService } from '../../services/vehicle.service';
import { driverService } from '../../services/driver.service';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Plus, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
  const limit = 15;

  // Filters
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
      // Filter out drivers with expired licenses
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

  // Selected vehicle load capacity check
  const selectedVehicleObj = availableVehicles.find((v) => v._id === form.vehicleId);
  const exceedsCapacity = selectedVehicleObj && Number(form.cargoWeightKg) > selectedVehicleObj.maxLoadCapacityKg;

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
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-sm text-gray-500 mt-1">Dispatch routes, manage active dispatches, and log trip metrics on completion</p>
        </div>
        {can('trips:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4.5 h-4.5" /> New Trip
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
          {['All', ...TRIP_STATUSES].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : trips.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No trips found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo & Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trips.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{t.source} ➔ {t.destination}</div>
                    <div className="text-xs text-gray-500">{t.plannedDistanceKm} km</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-800">{t.vehicleId?.registrationNumber || '—'}</div>
                    <div className="text-xs text-gray-500">{t.vehicleId?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{t.driverId?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{t.cargoWeightKg.toLocaleString()} kg</div>
                    <div className="text-xs text-gray-500">{formatCurrency(t.revenue)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {t.status === 'Draft' && can('trips:update') && (
                        <>
                          <button
                            onClick={() => setShowDispatchDialog(t)}
                            className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" /> Dispatch
                          </button>
                          <button
                            onClick={() => setShowCancelDialog(t)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
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
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Complete
                          </button>
                          <button
                            onClick={() => setShowCancelDialog(t)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
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
        )}
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Multi-Step Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Dispatch Request" maxWidth="max-w-md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Step 1: Route & Distance */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <span className="text-xs font-semibold text-primary uppercase">Step 1: Route Details</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source / Pickup Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Hub"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination / Drop Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Port"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Distance (km)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 150"
                  value={form.plannedDistanceKm}
                  onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.source || !form.destination || !form.plannedDistanceKm}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Vehicle */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-primary uppercase">Step 2: Assign Vehicle</span>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:underline">Back</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Vehicle</label>
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                  <option value="">Choose a vehicle...</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} — {v.name} ({v.type})
                    </option>
                  ))}
                </select>
                {selectedVehicleObj && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg">
                    Vehicle Type: <span className="font-semibold">{selectedVehicleObj.type}</span> • Capacity: <span className="font-semibold">{selectedVehicleObj.maxLoadCapacityKg.toLocaleString()} kg</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!form.vehicleId}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Driver */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-primary uppercase">Step 3: Assign Driver</span>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-gray-500 hover:underline">Back</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Driver</label>
                <select
                  required
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                  <option value="">Choose a driver...</option>
                  {availableDrivers.map((d) => (
                    <option key={d._id} value={d._id}>
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
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Cargo & Financials */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-primary uppercase">Step 4: Cargo & Financials</span>
                <button type="button" onClick={() => setStep(3)} className="text-xs text-gray-500 hover:underline">Back</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 4000"
                  value={form.cargoWeightKg}
                  onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${
                    exceedsCapacity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {exceedsCapacity && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" /> Exceeds vehicle load capacity ({selectedVehicleObj.maxLoadCapacityKg.toLocaleString()} kg)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Revenue (INR)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 50000"
                  value={form.revenue}
                  onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button
                  type="submit"
                  disabled={saving || exceedsCapacity}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Final Odometer Reading (km)</label>
            <input
              type="number"
              required
              min={showCompleteModal?.vehicleId?.odometerKm || 0}
              placeholder="e.g. 45150"
              value={completeForm.finalOdometerKm}
              onChange={(e) => setCompleteForm({ ...completeForm, finalOdometerKm: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Starting Odometer: {showCompleteModal?.vehicleId?.odometerKm?.toLocaleString()} km</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Consumed (Liters)</label>
            <input
              type="number"
              required
              min="1"
              placeholder="e.g. 35"
              value={completeForm.fuelConsumedLiters}
              onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumedLiters: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCompleteModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              {saving ? 'Completing...' : 'Log & Complete'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Dialog */}
      <ConfirmDialog
        isOpen={!!showDispatchDialog}
        onCancel={() => setShowDispatchDialog(null)}
        onConfirm={handleDispatch}
        title="Dispatch Trip?"
        message={`Are you sure you want to dispatch trip from ${showDispatchDialog?.source} to ${showDispatchDialog?.destination}? This will update the assigned vehicle (${showDispatchDialog?.vehicleId?.registrationNumber}) and driver (${showDispatchDialog?.driverId?.name}) to 'On Trip' status.`}
        confirmText="Confirm Dispatch"
        variant="primary"
      />

      {/* Cancel Dialog */}
      <Modal isOpen={!!showCancelDialog} onClose={() => setShowCancelDialog(null)} title="Cancel Trip Dispatch" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Provide a brief reason for cancelling this trip request:</p>
          <div>
            <textarea
              required
              rows="3"
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCancelDialog(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium">Close</button>
            <button
              onClick={handleCancel}
              disabled={!cancelReason.trim()}
              className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              Cancel Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripList;
