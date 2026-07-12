// ── Constants — mirrored from backend ──
export const ROLES = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'FleetManager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'SafetyOfficer',
  FINANCIAL_ANALYST: 'FinancialAnalyst',
};

export const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Trailer', 'Bus'];
export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
export const LICENSE_CATEGORIES = ['LMV', 'HMV', 'MCWG', 'Trailer'];
export const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
export const MAINTENANCE_TYPES = ['Scheduled', 'Repair', 'Inspection'];
export const EXPENSE_CATEGORIES = ['Toll', 'Fine', 'Insurance', 'Parking', 'Other'];

// ── Status → Badge Color Map (PRD Section 12.4) ──
export const STATUS_COLORS = {
  Available: 'bg-green-100 text-green-800',
  Completed: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  'On Trip': 'bg-blue-100 text-blue-800',
  Dispatched: 'bg-blue-100 text-blue-800',
  'In Shop': 'bg-amber-100 text-amber-800',
  'Off Duty': 'bg-amber-100 text-amber-800',
  Pending: 'bg-amber-100 text-amber-800',
  Retired: 'bg-red-100 text-red-800',
  Cancelled: 'bg-red-100 text-red-800',
  Suspended: 'bg-red-100 text-red-800',
  disabled: 'bg-red-100 text-red-800',
  Draft: 'bg-gray-100 text-gray-800',
  Open: 'bg-amber-100 text-amber-800',
  Closed: 'bg-green-100 text-green-800',
};

// ── Sidebar Navigation ──
export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', permission: 'dashboard:read' },
  { label: 'Vehicles', path: '/vehicles', icon: 'Truck', permission: 'vehicles:read' },
  { label: 'Drivers', path: '/drivers', icon: 'Users', permission: 'drivers:read' },
  { label: 'Trips', path: '/trips', icon: 'MapPin', permission: 'trips:read' },
  { label: 'Maintenance', path: '/maintenance', icon: 'Wrench', permission: 'maintenance:read' },
  { label: 'Fuel Logs', path: '/fuel-logs', icon: 'Fuel', permission: 'fuel-logs:read' },
  { label: 'Expenses', path: '/expenses', icon: 'Receipt', permission: 'expenses:read' },
  { label: 'Reports', path: '/reports', icon: 'BarChart3', permission: 'reports:read' },
  { label: 'Notifications', path: '/notifications', icon: 'Bell', permission: 'notifications:read' },
  { label: 'Settings', path: '/settings', icon: 'Settings', roles: ['Admin'] },
  { label: 'Activity Logs', path: '/activity-logs', icon: 'FileText', roles: ['Admin', 'FleetManager'] },
];
