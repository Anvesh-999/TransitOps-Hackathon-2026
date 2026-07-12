// ── Enums & Constants ──────────────────────────────────────────────
// Single source of truth for all enum values used across models, validators, and API.

const ROLES = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'FleetManager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'SafetyOfficer',
  FINANCIAL_ANALYST: 'FinancialAnalyst',
};

const ROLE_LIST = Object.values(ROLES);

const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Trailer', 'Bus'];

const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'MCWG', 'Trailer'];

const TRIP_STATUSES = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const MAINTENANCE_TYPES = ['Scheduled', 'Repair', 'Inspection'];

const MAINTENANCE_STATUSES = ['Open', 'Closed'];

const EXPENSE_CATEGORIES = ['Toll', 'Fine', 'Insurance', 'Parking', 'Other'];

const NOTIFICATION_TYPES = [
  'license_expiry_warning',
  'maintenance_due',
  'trip_dispatched',
  'trip_completed',
  'system',
];

const NOTIFICATION_PRIORITIES = ['Low', 'Medium', 'High'];

const USER_STATUSES = ['active', 'disabled'];

const ENTITY_TYPES = ['Vehicle', 'Driver', 'Trip', 'Maintenance', 'FuelLog', 'Expense', 'User'];

// ── Role → Permissions Map ─────────────────────────────────────────
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'vehicles:create', 'vehicles:read', 'vehicles:update', 'vehicles:delete',
    'drivers:create', 'drivers:read', 'drivers:update', 'drivers:delete',
    'trips:create', 'trips:read', 'trips:update', 'trips:delete',
    'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete',
    'fuel-logs:create', 'fuel-logs:read', 'fuel-logs:delete',
    'expenses:create', 'expenses:read', 'expenses:delete',
    'reports:read', 'reports:export',
    'notifications:read', 'notifications:update',
    'settings:read', 'settings:update',
    'activity-logs:read',
    'dashboard:read',
  ],
  [ROLES.FLEET_MANAGER]: [
    'vehicles:create', 'vehicles:read', 'vehicles:update',
    'drivers:read',
    'trips:create', 'trips:read', 'trips:update',
    'maintenance:create', 'maintenance:read', 'maintenance:update',
    'fuel-logs:create', 'fuel-logs:read',
    'expenses:create', 'expenses:read',
    'reports:read', 'reports:export',
    'notifications:read',
    'activity-logs:read',
    'dashboard:read',
  ],
  [ROLES.DRIVER]: [
    'vehicles:read',
    'drivers:read',
    'trips:read', 'trips:update',
    'fuel-logs:create',
    'notifications:read',
    'dashboard:read',
  ],
  [ROLES.SAFETY_OFFICER]: [
    'vehicles:read',
    'drivers:create', 'drivers:read', 'drivers:update',
    'trips:read',
    'maintenance:read',
    'reports:read',
    'notifications:read',
    'dashboard:read',
  ],
  [ROLES.FINANCIAL_ANALYST]: [
    'vehicles:read',
    'drivers:read',
    'trips:read',
    'maintenance:read',
    'fuel-logs:create', 'fuel-logs:read', 'fuel-logs:delete',
    'expenses:create', 'expenses:read', 'expenses:delete',
    'reports:read', 'reports:export',
    'notifications:read',
    'dashboard:read',
  ],
};

module.exports = {
  ROLES,
  ROLE_LIST,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  DRIVER_STATUSES,
  LICENSE_CATEGORIES,
  TRIP_STATUSES,
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUSES,
  EXPENSE_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  USER_STATUSES,
  ENTITY_TYPES,
  PERMISSIONS,
};
