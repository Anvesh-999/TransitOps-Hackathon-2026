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
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-sidebar">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">TransitOps</span>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">TransitOps v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
