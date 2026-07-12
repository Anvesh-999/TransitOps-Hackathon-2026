import { useState, useEffect } from 'react';
import { dashboardService } from '../../services/admin.service';
import { useAuth } from '../../contexts/AuthContext';
import { Truck, Users, MapPin, Wrench, TrendingUp, DollarSign, AlertTriangle, Activity } from 'lucide-react';
import { formatCurrency, formatPercent, timeAgo } from '../../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, activityRes] = await Promise.all([
          dashboardService.getKpis(),
          dashboardService.getRecentActivity(),
        ]);
        setKpis(kpiRes.data.data);
        setRecentActivity(activityRes.data.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Active Vehicles', value: kpis?.totalVehicles || 0, icon: Truck, color: 'bg-blue-500' },
    { label: 'Available Vehicles', value: kpis?.availableVehicles || 0, icon: Truck, color: 'bg-green-500' },
    { label: 'In Maintenance', value: kpis?.inShopVehicles || 0, icon: Wrench, color: 'bg-amber-500' },
    { label: 'Active Trips', value: kpis?.activeTrips || 0, icon: MapPin, color: 'bg-indigo-500' },
    { label: 'Pending Trips', value: kpis?.pendingTrips || 0, icon: MapPin, color: 'bg-gray-500' },
    { label: 'Drivers On Duty', value: kpis?.driversOnDuty || 0, icon: Users, color: 'bg-purple-500' },
    { label: 'Fleet Utilization', value: formatPercent(kpis?.fleetUtilization), icon: TrendingUp, color: 'bg-teal-500' },
    { label: 'Operational Cost (30d)', value: formatCurrency(kpis?.totalOperationalCost), icon: DollarSign, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-11 h-11 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {kpis?.expiringLicenses > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{kpis.expiringLicenses}</strong> driver license(s) expiring within 30 days
          </p>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-400 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{activity.userId?.name || 'System'}</span>
                    {' '}{activity.action.replace('.', ' ')}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
