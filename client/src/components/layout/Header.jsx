import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, LogOut, Search, User } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const roleDisplayName = {
    Admin: 'Administrator',
    FleetManager: 'Fleet Manager',
    Driver: 'Driver',
    SafetyOfficer: 'Safety Officer',
    FinancialAnalyst: 'Financial Analyst',
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicles, drivers, trips..."
          className="bg-transparent border-none outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center animate-pulse-dot">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{roleDisplayName[user?.role] || user?.role}</p>
          </div>
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-gray-500 hover:text-danger" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
