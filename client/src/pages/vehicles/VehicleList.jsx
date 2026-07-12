// TODO: Dev 2 — Complete Vehicle List page
// This is a working stub. Implement full CRUD table with filters per PRD Section 3.3.
import { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { Truck, Plus } from 'lucide-react';
import { STATUS_COLORS } from '../../utils/constants';

const VehicleList = () => {
  const { can } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleService.getAll({ limit: 50 }).then((res) => {
      setVehicles(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Registry</h1>
        {can('vehicles:create') && (
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Odometer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((v) => (
              <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{v.registrationNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{v.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{v.type}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{v.maxLoadCapacityKg} kg</td>
                <td className="px-6 py-4 text-sm text-gray-700">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100 text-gray-800'}`}>{v.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {vehicles.length === 0 && <div className="text-center py-12 text-gray-400"><Truck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No vehicles yet</p></div>}
      </div>
    </div>
  );
};

export default VehicleList;
