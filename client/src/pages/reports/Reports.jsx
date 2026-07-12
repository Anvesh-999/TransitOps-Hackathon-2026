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
import { Bar } from 'react-chartjs-2';
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

  // Monitor theme changes to redraw charts correctly
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
            backgroundColor: '#2563EB',
            borderRadius: 6,
          },
          {
            label: 'Estimated Days on Trip',
            data: data.map((d) => d.totalDays),
            backgroundColor: '#8B5CF6',
            borderRadius: 6,
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
            borderRadius: 6,
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
            borderRadius: 6,
          },
        ],
      };
    }

    return null;
  };

  const chartData = getChartData();

  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#475569';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          color: labelColor,
          font: { size: 11, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0F172A' : '#1F2937',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: activeTab === 'operational-cost',
        grid: { display: false },
        ticks: { color: labelColor, font: { size: 10, weight: '500' } }
      },
      y: {
        stacked: activeTab === 'operational-cost',
        grid: { color: gridColor },
        ticks: { color: labelColor, font: { size: 10, weight: '500' } }
      },
    },
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review operational breakdowns, analyze cost centers, and export CSV logs</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={loading || data.length === 0}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4.5 h-4.5" /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full sm:w-fit overflow-x-auto border border-slate-200/10">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setData([]); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Vehicle/Driver Dropdown */}
          {activeTab !== 'driver-stats' ? (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
              >
                <option value="All" className="bg-white dark:bg-slate-900">All Vehicles</option>
                {vehicles.map((v) => <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900">{v.registrationNumber}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-855 dark:text-slate-250 bg-white"
              >
                <option value="All" className="bg-white dark:bg-slate-900">All Drivers</option>
                {drivers.map((d) => <option key={d._id} value={d._id} className="bg-white dark:bg-slate-900">{d.name}</option>)}
              </select>
            </div>
          )}

          <button
            onClick={fetchReportData}
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-805 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-all border border-slate-700/20"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Display */}
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-20 text-center border border-slate-200 dark:border-slate-800">
          <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No report metrics logged</p>
          <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting the filter date range or selections</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Chart Widget */}
          {chartData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider mb-4">Visual Chart Representation</h3>
              <div className="h-80 relative">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-455 dark:text-slate-450 uppercase tracking-wider">Detailed Data Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                  {activeTab === 'utilization' && (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Reg #</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Trips Logged</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Est. Days on Road</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Total Mileage</th>
                    </tr>
                  )}
                  {activeTab === 'fuel-efficiency' && (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Reg #</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Total Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Total Fuel (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Efficiency (km/L)</th>
                    </tr>
                  )}
                  {activeTab === 'operational-cost' && (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Reg #</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Fuel Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Maintenance Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Other Expenses</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Total Op. Cost</th>
                    </tr>
                  )}
                  {activeTab === 'driver-stats' && (
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Driver Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">License</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Completed Trips</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Total Distance Logged</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase">Safety Rating</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {data.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      {activeTab === 'utilization' && (
                        <>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{item.registrationNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400 font-semibold">{item.tripCount} Trips</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400 font-semibold">{item.totalDays} Days</td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{item.totalDistanceKm?.toLocaleString()} km</td>
                        </>
                      )}
                      {activeTab === 'fuel-efficiency' && (
                        <>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{item.registrationNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{item.totalDistance?.toLocaleString()} km</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{item.totalFuel?.toLocaleString()} L</td>
                          <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 font-black">{item.efficiency} km/L</td>
                        </>
                      )}
                      {activeTab === 'operational-cost' && (
                        <>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{item.registrationNumber || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-350">{item.vehicleName || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{formatCurrency(item.fuel)}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{formatCurrency(item.maintenance)}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400">{formatCurrency(item.expenses)}</td>
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-black">{formatCurrency(item.total)}</td>
                        </>
                      )}
                      {activeTab === 'driver-stats' && (
                        <>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono tracking-wider">{item.licenseNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400 font-semibold">{item.tripsCompleted} Trips</td>
                          <td className="px-6 py-4 text-sm text-slate-655 dark:text-slate-400 font-semibold">{item.totalDistance?.toLocaleString()} km</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2.5 py-1 rounded-xl font-bold text-xs bg-opacity-10 dark:bg-slate-800 ${
                              item.safetyScore >= 75 ? 'bg-green-100 text-green-800 dark:text-green-400' :
                              item.safetyScore >= 50 ? 'bg-amber-100 text-amber-800 dark:text-amber-400' :
                              'bg-red-100 text-red-800 dark:text-red-400'
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
        </div>
      )}
    </div>
  );
};

export default Reports;
