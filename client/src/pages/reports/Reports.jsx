import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../../services/admin.service';
import { vehicleService } from '../../services/vehicle.service';
import { driverService } from '../../services/driver.service';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { BarChart3, Download, Calendar, Truck, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const REPORT_TABS = [
  { id: 'utilization', label: 'Vehicle Utilization' },
  { id: 'fuel-efficiency', label: 'Fuel Efficiency' },
  { id: 'operational-cost', label: 'Operational Cost' },
  { id: 'driver-stats', label: 'Driver Statistics' },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('utilization');
  const [data, setData] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [selectedDriver, setSelectedDriver] = useState('All');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { start: startDate, end: endDate };
      if (selectedVehicle !== 'All') params.vehicleId = selectedVehicle;
      if (selectedDriver !== 'All') params.driverId = selectedDriver;

      const res = await reportService.getReport(activeTab, params);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, selectedVehicle, selectedDriver]);

  const fetchFilters = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        vehicleService.getAll({ limit: 100 }),
        driverService.getAll({ limit: 100 }),
      ]);
      setVehicles(vRes.data.data);
      setDrivers(dRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleExportCSV = async () => {
    try {
      const params = { start: startDate, end: endDate, format: 'csv' };
      if (selectedVehicle !== 'All') params.vehicleId = selectedVehicle;
      if (selectedDriver !== 'All') params.driverId = selectedDriver;

      const res = await reportService.exportReport(activeTab, params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-report-${startDate}-to-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Chart Builders ──
  const getChartData = () => {
    if (!data || data.length === 0) return null;

    if (activeTab === 'utilization') {
      return {
        labels: data.map((d) => d.registrationNumber),
        datasets: [
          {
            label: 'Total Trips Logged',
            data: data.map((d) => d.tripCount),
            backgroundColor: '#3B82F6',
            borderRadius: 8,
          },
          {
            label: 'Estimated Days on Trip',
            data: data.map((d) => d.totalDays),
            backgroundColor: '#8B5CF6',
            borderRadius: 8,
          },
        ],
      };
    }

    if (activeTab === 'fuel-efficiency') {
      return {
        labels: data.map((d) => d.registrationNumber),
        datasets: [
          {
            label: 'Fuel Efficiency (km/L)',
            data: data.map((d) => d.efficiency),
            backgroundColor: '#10B981',
            borderRadius: 8,
          },
        ],
      };
    }

    if (activeTab === 'operational-cost') {
      return {
        labels: data.map((d) => d.registrationNumber || d.vehicleName),
        datasets: [
          {
            label: 'Fuel Cost',
            data: data.map((d) => d.fuel),
            backgroundColor: '#3B82F6',
          },
          {
            label: 'Maintenance',
            data: data.map((d) => d.maintenance),
            backgroundColor: '#F59E0B',
          },
          {
            label: 'Expenses',
            data: data.map((d) => d.expenses),
            backgroundColor: '#EF4444',
          },
        ],
      };
    }

    if (activeTab === 'driver-stats') {
      return {
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: 'Trips Completed',
            data: data.map((d) => d.tripsCompleted),
            backgroundColor: '#8B5CF6',
            borderRadius: 8,
          },
        ],
      };
    }

    return null;
  };

  const chartData = getChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } },
      tooltip: { cornerRadius: 8 },
    },
    scales: activeTab !== 'fuel-efficiency' && activeTab !== 'driver-stats' ? {
      x: { stacked: activeTab === 'operational-cost', grid: { display: false } },
      y: { stacked: activeTab === 'operational-cost', grid: { color: '#F3F4F6' } },
    } : {
      x: { grid: { display: false } },
      y: { grid: { color: '#F3F4F6' } },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Review operational breakdowns, analyze cost centers, and export CSV logs</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || data.length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium disabled:opacity-50"
        >
          <Download className="w-4.5 h-4.5" /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setData([]); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Vehicle Dropdown */}
          {activeTab !== 'driver-stats' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="All">All Vehicles</option>
                {vehicles.map((v) => <option key={v._id} value={v._id}>{v.registrationNumber}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="All">All Drivers</option>
                {drivers.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}

          <button
            onClick={fetchReportData}
            className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Analytics Display */}
      {loading ? (
        <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No report metrics logged</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the filter date range or selections</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Chart Widget */}
          {chartData && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Visual Chart Representation</h3>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Detailed Data Log</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {activeTab === 'utilization' && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trips Logged</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Est. Days on Road</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Mileage</th>
                  </tr>
                )}
                {activeTab === 'fuel-efficiency' && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Distance</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Fuel (L)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Efficiency (km/L)</th>
                  </tr>
                )}
                {activeTab === 'operational-cost' && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reg #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fuel Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Maintenance Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Other Expenses</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Op. Cost</th>
                  </tr>
                )}
                {activeTab === 'driver-stats' && (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Driver Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">License</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Completed Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Distance Logged</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Safety Rating</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {activeTab === 'utilization' && (
                      <>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.registrationNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.tripCount} Trips</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.totalDays} Days</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.totalDistanceKm?.toLocaleString()} km</td>
                      </>
                    )}
                    {activeTab === 'fuel-efficiency' && (
                      <>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.registrationNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.totalDistance?.toLocaleString()} km</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.totalFuel?.toLocaleString()} L</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-bold text-green-600">{item.efficiency} km/L</td>
                      </>
                    )}
                    {activeTab === 'operational-cost' && (
                      <>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.registrationNumber || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.vehicleName || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.fuel)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.maintenance)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(item.expenses)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-bold">{formatCurrency(item.total)}</td>
                      </>
                    )}
                    {activeTab === 'driver-stats' && (
                      <>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.licenseNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.tripsCompleted} Trips</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{item.totalDistance?.toLocaleString()} km</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2.5 py-1.5 rounded-full font-semibold text-xs bg-opacity-10 ${
                            item.safetyScore >= 75 ? 'bg-green-100 text-green-800' :
                            item.safetyScore >= 50 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>{item.safetyScore} / 100</span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
