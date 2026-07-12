import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../utils/constants';
import { LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, Receipt, BarChart3, Bell, Settings, FileText } from 'lucide-react';

const iconMap = { LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel, Receipt, BarChart3, Bell, Settings, FileText };

const Sidebar = () => {
  const { can, hasRole } = useAuth();
  const location = useLocation();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.roles) return hasRole(...item.roles);
    if (item.permission) return can(item.permission);
    return true;
  });

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-sidebar duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-wide">TransitOps</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-400 dark:text-slate-550 font-medium">TransitOps v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
