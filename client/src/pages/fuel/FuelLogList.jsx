// TODO: Dev 4 — Complete Fuel Log page
import { useState, useEffect } from 'react';
import { fuelLogService } from '../../services/finance.service';
import { Fuel, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const FuelLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fuelLogService.getAll({ limit: 50 }).then((res) => { setLogs(res.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> Add Fuel Log</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Liters</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost/L</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((l) => (
              <tr key={l._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{l.vehicleId?.registrationNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{l.liters} L</td>
                <td className="px-6 py-4 text-sm text-gray-700">{l.costPerLiter ? formatCurrency(l.costPerLiter) : '—'}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(l.totalCost)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(l.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-12 text-gray-400"><Fuel className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No fuel logs</p></div>}
      </div>
    </div>
  );
};

export default FuelLogList;
