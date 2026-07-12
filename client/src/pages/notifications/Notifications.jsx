import { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Check, CheckSquare } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    const matchesPriority = priorityFilter === 'All' || n.priority === priorityFilter;
    const matchesType = typeFilter === 'All' || n.type === typeFilter;
    return matchesPriority && matchesType;
  });

  // Date grouping helper
  const getGroup = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return 'Older';
  };

  const groups = { Today: [], Yesterday: [], Older: [] };
  filteredNotifications.forEach((n) => {
    const groupName = getGroup(n.createdAt);
    groups[groupName].push(n);
  });

  const priorityColors = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Alerts, dispatch updates, and system messages</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <CheckSquare className="w-4.5 h-4.5" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
          >
            <option value="All">All Types</option>
            <option value="license_expiry_warning">License Expiry Warning</option>
            <option value="trip_dispatched">Trip Dispatched</option>
            <option value="trip_completed">Trip Completed</option>
            <option value="trip_cancelled">Trip Cancelled</option>
            <option value="maintenance_created">Maintenance Logged</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No notifications match your current filters</p>
          </div>
        ) : (
          ['Today', 'Yesterday', 'Older'].map((group) => {
            if (groups[group].length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">{group}</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {groups[group].map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        !n.isRead ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            !n.isRead ? 'bg-primary animate-pulse-dot' : 'bg-transparent'
                          }`}
                        ></div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{timeAgo(n.createdAt)}</span>
                            <span className={`px-1.5 py-0.5 border text-[10px] font-semibold rounded ${priorityColors[n.priority]}`}>
                              {n.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Mark as Read"
                        >
                          <Check className="w-4 h-4 text-gray-500 hover:text-primary" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
