// TODO: Dev 2 — Complete Maintenance List page
import { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenance.service';
import { useAuth } from '../../contexts/AuthContext';
import { Wrench, Plus } from 'lucide-react';
import { STATUS_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';

const MaintenanceList = () => {
  const { can } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    maintenanceService.getAll({ limit: 50 }).then((res) => {
      setRecords(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        {can('maintenance:create') && (
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> New Record
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected End</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.vehicleId?.registrationNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.type}</td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{r.description}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(r.cost)}</td>
                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.expectedEndDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <div className="text-center py-12 text-gray-400"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No maintenance records</p></div>}
      </div>
    </div>
  );
};

export default MaintenanceList;
