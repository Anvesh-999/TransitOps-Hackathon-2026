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
    High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-955/20 dark:text-red-400 dark:border-red-800/30',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-800/30',
    Low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-800/30',
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Alerts, dispatch updates, and system compliance messages</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <CheckSquare className="w-4.5 h-4.5" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 mb-1.5 uppercase tracking-wider">Priority</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-855 dark:text-slate-250 bg-white"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 text-center border border-slate-200 dark:border-slate-800">
            <Bell className="w-16 h-16 text-slate-300 dark:text-slate-705 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-750 dark:text-slate-350">All caught up!</p>
            <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">No notifications match your current filters</p>
          </div>
        ) : (
          ['Today', 'Yesterday', 'Older'].map((group) => {
            if (groups[group].length === 0) return null;

            return (
              <div key={group} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">{group}</h3>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
                  {groups[group].map((n) => (
                    <div
                      key={n._id}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        !n.isRead ? 'bg-blue-50/10 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            !n.isRead ? 'bg-primary dark:bg-blue-400 animate-pulse' : 'bg-transparent'
                          }`}
                        ></div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-slate-800 dark:text-slate-205 font-semibold">{n.message}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-450 dark:text-slate-450 font-medium">{timeAgo(n.createdAt)}</span>
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-lg ${priorityColors[n.priority]}`}>
                              {n.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => markAsRead(n._id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 transition-colors"
                          title="Mark as Read"
                        >
                          <Check className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400" />
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
