import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Filler,
} from 'chart.js';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Truck, Users, MapPin, Wrench, TrendingUp, DollarSign,
  AlertTriangle, Activity, RefreshCw, ArrowUpRight, ArrowDownRight,
  Fuel, Receipt,
} from 'lucide-react';
import { formatCurrency, formatPercent, timeAgo } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler);

const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [kpiRes, chartRes, activityRes] = await Promise.all([
        dashboardService.getKpis({ days: range }),
        dashboardService.getCharts({ days: range }),
        dashboardService.getRecentActivity(),
      ]);
      setKpis(kpiRes.data.data);
      setCharts(chartRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── KPI Card Data ──
  const primaryKpis = [
    { label: 'Total Vehicles', value: kpis?.totalVehicles || 0, icon: Truck, color: 'from-blue-500 to-blue-600', path: '/vehicles' },
    { label: 'Active Trips', value: kpis?.activeTrips || 0, icon: MapPin, color: 'from-indigo-500 to-indigo-600', path: '/trips' },
    { label: 'Available Drivers', value: (kpis?.totalDrivers || 0) - (kpis?.driversOnDuty || 0), icon: Users, color: 'from-purple-500 to-purple-600', path: '/drivers' },
    { label: 'Fleet Utilization', value: formatPercent(kpis?.fleetUtilization), icon: TrendingUp, color: 'from-teal-500 to-teal-600', isText: true },
  ];

  const financialKpis = [
    { label: 'Revenue', value: formatCurrency(kpis?.totalRevenue), icon: ArrowUpRight, color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Op. Cost', value: formatCurrency(kpis?.totalOperationalCost), icon: ArrowDownRight, color: 'text-red-600', bgColor: 'bg-red-50' },
    { label: 'Net Profit', value: formatCurrency(kpis?.netProfit), icon: DollarSign, color: kpis?.netProfit >= 0 ? 'text-green-600' : 'text-red-600', bgColor: kpis?.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ];

  const statusKpis = [
    { label: 'Available', value: kpis?.availableVehicles || 0, color: 'bg-green-500' },
    { label: 'On Trip', value: kpis?.onTripVehicles || 0, color: 'bg-blue-500' },
    { label: 'In Shop', value: kpis?.inShopVehicles || 0, color: 'bg-amber-500' },
    { label: 'Pending Trips', value: kpis?.pendingTrips || 0, color: 'bg-gray-500' },
  ];

  // ── Chart Options ──
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
      tooltip: { backgroundColor: '#1F2937', titleFont: { size: 13 }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8 },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1F2937', padding: 12, cornerRadius: 8 },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#F3F4F6' }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  // ── Action labels for recent activity ──
  const actionEmoji = {
    'vehicle.create': '🚛', 'vehicle.update': '✏️', 'vehicle.delete': '🗑️', 'vehicle.statusChange': '🔄',
    'driver.create': '👤', 'driver.update': '✏️', 'driver.delete': '🗑️', 'driver.suspend': '⚠️',
    'trip.create': '📋', 'trip.dispatch': '🚀', 'trip.complete': '✅', 'trip.cancel': '❌',
    'maintenance.create': '🔧', 'maintenance.close': '✅', 'maintenance.update': '✏️',
    'fuelLog.create': '⛽', 'expense.create': '💰',
    'user.login': '🔑', 'user.create': '👤', 'user.update': '✏️', 'user.resetPassword': '🔐',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name} 👋</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  range === opt.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPIs — Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryKpis.map((card) => (
          <div
            key={card.label}
            onClick={() => card.path && navigate(card.path)}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] ${card.path ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial KPIs + Vehicle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Financial Summary ({range}d)</h3>
          <div className="grid grid-cols-3 gap-4">
            {financialKpis.map((kpi) => (
              <div key={kpi.label} className={`${kpi.bgColor} rounded-xl p-4 text-center`}>
                <kpi.icon className={`w-5 h-5 mx-auto mb-1 ${kpi.color}`} />
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Vehicle Status</h3>
          <div className="grid grid-cols-4 gap-3">
            {statusKpis.map((s) => (
              <div key={s.label} className="text-center">
                <div className={`w-10 h-10 ${s.color} rounded-xl mx-auto flex items-center justify-center mb-2`}>
                  <span className="text-white text-lg font-bold">{s.value}</span>
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Mini utilization bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Fleet Utilization</span>
              <span>{formatPercent(kpis?.fleetUtilization)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(kpis?.fleetUtilization || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {kpis?.expiringLicenses > 0 && (
        <div
          onClick={() => navigate('/drivers')}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800">
              {kpis.expiringLicenses} driver license(s) expiring within 30 days
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Click to view drivers →</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Cost Breakdown Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Cost Breakdown
            </h3>
            <div className="h-56">
              <Doughnut data={charts.costBreakdown} options={{ ...pieOptions, cutout: '60%' }} />
            </div>
          </div>

          {/* Trip Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Trips by Status
            </h3>
            <div className="h-56">
              {charts.tripStatusBreakdown?.datasets?.[0]?.data?.length > 0 ? (
                <Pie data={charts.tripStatusBreakdown} options={pieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No trip data</div>
              )}
            </div>
          </div>

          {/* Vehicle Type Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Fleet by Type
            </h3>
            <div className="h-56">
              {charts.vehicleTypeDistribution?.datasets?.[0]?.data?.length > 0 ? (
                <Doughnut data={charts.vehicleTypeDistribution} options={{ ...pieOptions, cutout: '55%' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No vehicle data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trips Trend + Safety Distribution */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trips per Day Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Trip Volume Trend
            </h3>
            <div className="h-56">
              {charts.tripsPerDay?.datasets?.[0]?.data?.length > 0 ? (
                <Bar data={charts.tripsPerDay} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No trip data yet</div>
              )}
            </div>
          </div>

          {/* Safety Score Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Driver Safety Scores
            </h3>
            <div className="h-56">
              {charts.safetyDistribution?.datasets?.[0]?.data?.length > 0 ? (
                <Bar data={charts.safetyDistribution} options={{ ...barOptions, indexAxis: 'y' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No driver data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No recent activity — start creating vehicles and trips!</p>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{actionEmoji[activity.action] || '📝'}</span>
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{activity.userId?.name || 'System'}</span>
                      {' '}
                      <span className="text-gray-500">{activity.action.replace('.', ' → ')}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
