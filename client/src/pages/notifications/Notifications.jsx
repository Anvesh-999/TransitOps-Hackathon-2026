import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, Check } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

const Notifications = () => {
  const { notifications, markAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className={`p-4 flex items-center justify-between ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${!n.isRead ? 'bg-primary animate-pulse-dot' : 'bg-transparent'}`}></div>
                <div>
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markAsRead(n._id)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <Check className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
