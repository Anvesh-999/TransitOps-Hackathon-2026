// TODO: Dev 2 — Complete Driver List page
import { useState, useEffect } from 'react';
import { driverService } from '../../services/driver.service';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus } from 'lucide-react';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const DriverList = () => {
  const { can } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverService.getAll({ limit: 50 }).then((res) => {
      setDrivers(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
        {can('drivers:create') && (
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drivers.map((d) => (
              <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{d.licenseNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{d.licenseCategory}</td>
                <td className={`px-6 py-4 text-sm ${d.isLicenseExpired ? 'text-red-600 font-medium' : d.isLicenseExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-700'}`}>
                  {formatDate(d.licenseExpiryDate)}
                  {d.isLicenseExpired && ' ⚠️ Expired'}
                  {d.isLicenseExpiringSoon && ' ⏰ Expiring Soon'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{d.safetyScore}/100</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[d.status]}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {drivers.length === 0 && <div className="text-center py-12 text-gray-400"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No drivers yet</p></div>}
      </div>
    </div>
  );
};

export default DriverList;
