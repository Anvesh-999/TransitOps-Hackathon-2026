// TODO: Dev 3 — Complete Trip List page with dispatch/complete/cancel actions
import { useState, useEffect } from 'react';
import { tripService } from '../../services/trip.service';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Plus } from 'lucide-react';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const TripList = () => {
  const { can } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripService.getAll({ limit: 50 }).then((res) => {
      setTrips(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
        {can('trips:create') && (
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> New Trip
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trips.map((t) => (
              <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.source} → {t.destination}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{t.vehicleId?.registrationNumber || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{t.driverId?.name || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{t.cargoWeightKg} kg</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="text-center py-12 text-gray-400"><MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No trips yet</p></div>}
      </div>
    </div>
  );
};

export default TripList;
