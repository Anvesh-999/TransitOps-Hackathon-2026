import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';

// Pages
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import VehicleList from '../pages/vehicles/VehicleList';
import DriverList from '../pages/drivers/DriverList';
import TripList from '../pages/trips/TripList';
import MaintenanceList from '../pages/maintenance/MaintenanceList';
import FuelLogList from '../pages/fuel/FuelLogList';
import ExpenseList from '../pages/expenses/ExpenseList';
import Reports from '../pages/reports/Reports';
import Notifications from '../pages/notifications/Notifications';
import Settings from '../pages/settings/Settings';
import ActivityLogs from '../pages/activityLogs/ActivityLogs';

const AppRouter = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicles" element={<RoleRoute permissions={['vehicles:read']}><VehicleList /></RoleRoute>} />
        <Route path="/drivers" element={<RoleRoute permissions={['drivers:read']}><DriverList /></RoleRoute>} />
        <Route path="/trips" element={<RoleRoute permissions={['trips:read']}><TripList /></RoleRoute>} />
        <Route path="/maintenance" element={<RoleRoute permissions={['maintenance:read']}><MaintenanceList /></RoleRoute>} />
        <Route path="/fuel-logs" element={<RoleRoute permissions={['fuel-logs:read']}><FuelLogList /></RoleRoute>} />
        <Route path="/expenses" element={<RoleRoute permissions={['expenses:read']}><ExpenseList /></RoleRoute>} />
        <Route path="/reports" element={<RoleRoute permissions={['reports:read']}><Reports /></RoleRoute>} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<RoleRoute roles={['Admin']}><Settings /></RoleRoute>} />
        <Route path="/activity-logs" element={<RoleRoute roles={['Admin', 'FleetManager']}><ActivityLogs /></RoleRoute>} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;
