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
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Truck, Users, MapPin, Wrench, TrendingUp, DollarSign,
  AlertTriangle, Activity, RefreshCw, ArrowUpRight, ArrowDownRight,
  Shield, CheckCircle2, Navigation,
} from 'lucide-react';
import { formatCurrency, formatPercent, timeAgo } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler, PointElement, LineElement);

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

  // Monitor theme changes to redraw charts correctly
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ── Simulated Interactive GPS Map Tracker ──
  const [vehiclePositions, setVehiclePositions] = useState({
    'TRK-402': { x: 40, y: 50, step: 0, from: 'North Hub', to: 'East Port', speed: '62 km/h', color: '#3B82F6' },
    'VAN-108': { x: 100, y: 20, step: 0, from: 'South Depot', to: 'West Market', speed: '45 km/h', color: '#10B981' },
    'BIK-901': { x: 30, y: 120, step: 0, from: 'Central Depot', to: 'City Center', speed: '28 km/h', color: '#8B5CF6' },
  });

  useEffect(() => {
    const TRK_ROUTE = [
      { x: 40, y: 50 }, { x: 100, y: 50 }, { x: 180, y: 50 }, { x: 260, y: 50 },
      { x: 260, y: 110 }, { x: 260, y: 180 }, { x: 180, y: 180 }, { x: 100, y: 180 }
    ];
    const VAN_ROUTE = [
      { x: 100, y: 20 }, { x: 100, y: 80 }, { x: 100, y: 140 }, { x: 100, y: 180 },
      { x: 210, y: 180 }, { x: 320, y: 180 }, { x: 320, y: 120 }, { x: 200, y: 120 }
    ];
    const BIK_ROUTE = [
      { x: 30, y: 120 }, { x: 110, y: 120 }, { x: 190, y: 120 }, { x: 270, y: 120 },
      { x: 370, y: 120 }, { x: 300, y: 60 }, { x: 150, y: 60 }
    ];

    const timer = setInterval(() => {
      setVehiclePositions((prev) => {
        const nextTrkStep = (prev['TRK-402'].step + 1) % TRK_ROUTE.length;
        const nextVanStep = (prev['VAN-108'].step + 1) % VAN_ROUTE.length;
        const nextBikStep = (prev['BIK-901'].step + 1) % BIK_ROUTE.length;
        return {
          'TRK-402': { ...prev['TRK-402'], x: TRK_ROUTE[nextTrkStep].x, y: TRK_ROUTE[nextTrkStep].y, step: nextTrkStep },
          'VAN-108': { ...prev['VAN-108'], x: VAN_ROUTE[nextVanStep].x, y: VAN_ROUTE[nextVanStep].y, step: nextVanStep },
          'BIK-901': { ...prev['BIK-901'], x: BIK_ROUTE[nextBikStep].x, y: BIK_ROUTE[nextBikStep].y, step: nextBikStep },
        };
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Analyzing operational logs...</p>
        </div>
      </div>
    );
  }

  // ── KPI Card Data ──
  const primaryKpis = [
    { label: 'Total Vehicles', value: kpis?.totalVehicles || 0, icon: Truck, color: 'from-blue-600 to-indigo-700', path: '/vehicles', shadow: 'shadow-blue-500/10' },
    { label: 'Active Trips', value: kpis?.activeTrips || 0, icon: MapPin, color: 'from-emerald-500 to-teal-600', path: '/trips', shadow: 'shadow-emerald-500/10' },
    { label: 'Available Drivers', value: (kpis?.totalDrivers || 0) - (kpis?.driversOnDuty || 0), icon: Users, color: 'from-violet-500 to-purple-600', path: '/drivers', shadow: 'shadow-violet-500/10' },
    { label: 'Fleet Utilization', value: formatPercent(kpis?.fleetUtilization), icon: TrendingUp, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/10', isText: true },
  ];

  const financialKpis = [
    { label: 'Revenue', value: formatCurrency(kpis?.totalRevenue), icon: ArrowUpRight, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30' },
    { label: 'Op. Cost', value: formatCurrency(kpis?.totalOperationalCost), icon: ArrowDownRight, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30' },
    { label: 'Net Profit', value: formatCurrency(kpis?.netProfit), icon: DollarSign, color: kpis?.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400', bgColor: kpis?.netProfit >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30' : 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30' },
  ];

  const statusKpis = [
    { label: 'Available', value: kpis?.availableVehicles || 0, color: 'bg-emerald-500' },
    { label: 'On Trip', value: kpis?.onTripVehicles || 0, color: 'bg-blue-500' },
    { label: 'In Shop', value: kpis?.inShopVehicles || 0, color: 'bg-amber-500' },
    { label: 'Pending Trips', value: kpis?.pendingTrips || 0, color: 'bg-slate-400 dark:bg-slate-600' },
  ];

  // ── Theme-Responsive Chart Styling Options ──
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const labelColor = isDark ? '#94A3B8' : '#475569';

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          font: { size: 11, weight: '500' },
          color: labelColor,
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#0F172A' : '#1F2937',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#0F172A' : '#1F2937',
        borderColor: isDark ? '#334155' : '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: labelColor, font: { size: 10, weight: '500' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: labelColor, font: { size: 10, weight: '500' } }
      },
    },
  };

  const actionEmoji = {
    'vehicle.create': '🚛', 'vehicle.update': '✏️', 'vehicle.delete': '🗑️', 'vehicle.statusChange': '🔄',
    'driver.create': '👤', 'driver.update': '✏️', 'driver.delete': '🗑️', 'driver.suspend': '⚠️',
    'trip.create': '📋', 'trip.dispatch': '🚀', 'trip.complete': '✅', 'trip.cancel': '❌',
    'maintenance.create': '🔧', 'maintenance.close': '✅', 'maintenance.update': '✏️',
    'fuelLog.create': '⛽', 'expense.create': '💰',
    'user.login': '🔑', 'user.create': '👤', 'user.update': '✏️', 'user.resetPassword': '🔐',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span> 👋</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selection */}
          <div className="flex bg-slate-200/60 dark:bg-slate-800/85 rounded-xl p-1 border border-slate-200/20">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  range === opt.value
                    ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm'
                    : 'text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Sync Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 transition-colors disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Gradient Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryKpis.map((card) => (
          <div
            key={card.label}
            onClick={() => card.path && navigate(card.path)}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${card.path ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-extrabold">{card.value}</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Map GPS Tracking + Safety Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Simulated Map */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Live Fleet Dispatch Map</h3>
            </div>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Simulated Real-time GPS</span>
          </div>

          <div className="relative bg-slate-950 border border-slate-900 rounded-xl overflow-hidden h-[240px]">
            {/* SVG Stylized Roads */}
            <svg viewBox="0 0 400 200" className="w-full h-full opacity-90">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Roads grid (Highway mock paths) */}
              <path d="M 40,50 L 260,50 L 260,180" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
              <path d="M 100,20 L 100,180 L 320,180" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />
              <path d="M 30,120 L 370,120" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" strokeLinecap="round" />

              {/* Highway markings dashes */}
              <path d="M 40,50 L 260,50 L 260,180" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
              <path d="M 100,20 L 100,180 L 320,180" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />
              <path d="M 30,120 L 370,120" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="5,5" className="animate-dash" />

              {/* Hub Stations circles */}
              <circle cx="40" cy="50" r="5" fill="#2563EB" />
              <circle cx="260" cy="180" r="5" fill="#3B82F6" />
              <circle cx="100" cy="20" r="5" fill="#10B981" />
              <circle cx="320" cy="180" r="5" fill="#8B5CF6" />
              <circle cx="370" cy="120" r="5" fill="#EF4444" />
              <circle cx="30" cy="120" r="5" fill="#F59E0B" />

              {/* Moving Vehicles dots */}
              {Object.entries(vehiclePositions).map(([id, pos]) => (
                <g key={id} style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: 'transform 4s linear' }}>
                  {/* Glowing Radar circle */}
                  <circle cx="0" cy="0" r="7" fill={pos.color} opacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="4.5" fill={pos.color} />
                </g>
              ))}
            </svg>

            {/* Float HUD Overlays */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-[10px] space-y-1 text-slate-300 font-mono shadow-lg">
              <p className="font-bold text-white mb-1 flex items-center gap-1 border-b border-slate-800 pb-0.5"><Navigation className="w-2.5 h-2.5 text-blue-400 animate-pulse" /> Live Tracker</p>
              <p className="flex justify-between gap-6"><span className="text-slate-500">TRK-402:</span> <span>{vehiclePositions['TRK-402'].speed} (60%)</span></p>
              <p className="flex justify-between gap-6"><span className="text-slate-500">VAN-108:</span> <span>{vehiclePositions['VAN-108'].speed} (82%)</span></p>
              <p className="flex justify-between gap-6"><span className="text-slate-500">BIK-901:</span> <span>{vehiclePositions['BIK-901'].speed} (95%)</span></p>
            </div>
          </div>
        </div>

        {/* Safety Leaderboard */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Top Drivers Safety Score
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Rajesh Kumar', score: 98, role: 'HMV Driver', avatarBg: 'from-blue-600 to-indigo-500' },
              { name: 'Priya Sharma', score: 95, role: 'LMV Driver', avatarBg: 'from-emerald-500 to-teal-500' },
              { name: 'Alex Johnson', score: 93, role: 'Trailer Driver', avatarBg: 'from-violet-500 to-fuchsia-500' },
            ].map((drv, idx) => (
              <div key={drv.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${drv.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                      {drv.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="absolute -top-1 -left-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white dark:border-slate-900 text-[8px] font-bold text-slate-900 flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">{drv.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{drv.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450">{drv.score}%</span>
                  <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${drv.score}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Overview + Vehicle Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Financial Overview ({range}d)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {financialKpis.map((kpi) => (
              <div key={kpi.label} className={`${kpi.bgColor} rounded-xl p-4 transition-all duration-300`}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Status Map */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Vehicle Operational Status</h3>
            <div className="grid grid-cols-4 gap-2">
              {statusKpis.map((s) => (
                <div key={s.label} className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850">
                  <div className={`w-8 h-8 ${s.color} rounded-lg mx-auto flex items-center justify-center mb-1.5 shadow-sm`}>
                    <span className="text-white text-xs font-black">{s.value}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Progress Fleet Utilization */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1.5">
              <span>Overall Fleet Utilization</span>
              <span className="font-bold">{formatPercent(kpis?.fleetUtilization)}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(kpis?.fleetUtilization || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Expiring Driver Licenses Notification Widget */}
      {kpis?.expiringLicenses > 0 && (
        <div
          onClick={() => navigate('/drivers')}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] animate-pulse-slow"
        >
          <div className="w-10 h-10 bg-amber-550/20 dark:bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {kpis.expiringLicenses} driver license(s) expiring within 30 days
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">Urgent compliance check needed. Click to inspect roster →</p>
          </div>
        </div>
      )}

      {/* Primary Graphs & Data Visualizations Row */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Breakdown Pie */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Operational Cost Breakdown
            </h3>
            <div className="h-56 relative">
              <Doughnut data={charts.costBreakdown} options={{ ...pieOptions, cutout: '65%' }} />
            </div>
          </div>

          {/* Trip Status Pie */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Trips Dispatch Status
            </h3>
            <div className="h-56 relative">
              {charts.tripStatusBreakdown?.datasets?.[0]?.data?.length > 0 ? (
                <Pie data={charts.tripStatusBreakdown} options={pieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-medium">No active trips dispatched</div>
              )}
            </div>
          </div>

          {/* Vehicle Type Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-violet-500" />
              Fleet Composition Type
            </h3>
            <div className="h-56 relative">
              {charts.vehicleTypeDistribution?.datasets?.[0]?.data?.length > 0 ? (
                <Doughnut data={charts.vehicleTypeDistribution} options={{ ...pieOptions, cutout: '65%' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-medium">No registered fleet vehicles</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trip Trend + Safety Distribution Charts Row */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trip Volume Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Trip volume dispatch trend
            </h3>
            <div className="h-60 relative">
              {charts.tripsPerDay?.datasets?.[0]?.data?.length > 0 ? (
                <Bar data={charts.tripsPerDay} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-medium">Insufficient trip metrics for trend graph</div>
              )}
            </div>
          </div>

          {/* Safety Score Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Safety compliance spread
            </h3>
            <div className="h-60 relative">
              {charts.safetyDistribution?.datasets?.[0]?.data?.length > 0 ? (
                <Bar data={charts.safetyDistribution} options={{ ...barOptions, indexAxis: 'y' }} />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-xs font-medium">No scores log detected</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Audit Logs / Activity logs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            System Audit & Activity Stream
          </h2>
          <span
            onClick={() => navigate('/activity-logs')}
            className="text-xs text-primary dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            View all logs →
          </span>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-slate-450 dark:text-slate-550 text-sm py-6 text-center font-medium">No recent logs recorded. Initialize fleet operations.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 px-2 rounded-xl transition-all duration-150">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {actionEmoji[activity.action] || '📝'}
                  </span>
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{activity.userId?.name || 'System'}</span>
                      {' '}
                      <span className="text-slate-500 dark:text-slate-400">
                        {activity.action.split('.').join(' → ')}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap font-medium">{timeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
