import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, LogOut, Search, User, Sun, Moon } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    localStorage.setItem('theme', theme === 'light' ? 'dark' : 'light');
  };

  const roleDisplayName = {
    Admin: 'Administrator',
    FleetManager: 'Fleet Manager',
    Driver: 'Driver',
    SafetyOfficer: 'Safety Officer',
    FinancialAnalyst: 'Financial Analyst',
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-all duration-300">
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 w-80 transition-colors">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search vehicles, drivers, trips..."
          className="bg-transparent border-none outline-none text-sm flex-1 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 active:scale-95"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 animate-float" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400 animate-float" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center animate-pulse-dot">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{roleDisplayName[user?.role] || user?.role}</p>
          </div>
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-danger dark:hover:text-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
