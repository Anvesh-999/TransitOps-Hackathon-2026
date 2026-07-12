// TODO: Dev 1 — Complete Activity Logs page
import { useState, useEffect } from 'react';
import { activityLogService } from '../../services/admin.service';
import { FileText } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    activityLogService.getAll({ page, limit: 25 }).then((res) => {
      setLogs(res.data.data);
      setTotal(res.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  const actionLabels = {
    'vehicle.create': '🚛 Created vehicle',
    'vehicle.update': '✏️ Updated vehicle',
    'vehicle.delete': '🗑️ Deleted vehicle',
    'vehicle.statusChange': '🔄 Changed vehicle status',
    'driver.create': '👤 Added driver',
    'driver.update': '✏️ Updated driver',
    'driver.delete': '🗑️ Removed driver',
    'driver.suspend': '⚠️ Suspended driver',
    'driver.statusChange': '🔄 Changed driver status',
    'trip.create': '📋 Created trip',
    'trip.dispatch': '🚀 Dispatched trip',
    'trip.complete': '✅ Completed trip',
    'trip.cancel': '❌ Cancelled trip',
    'maintenance.create': '🔧 Created maintenance',
    'maintenance.close': '✅ Closed maintenance',
    'fuelLog.create': '⛽ Added fuel log',
    'expense.create': '💰 Added expense',
    'user.login': '🔑 User logged in',
    'user.create': '👤 Created user',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activity logs</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{log.userId?.name || 'System'}</span>
                  {' — '}
                  {actionLabels[log.action] || log.action}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Entity: {log.entityType} • ID: {log.entityId?.toString().slice(-6)}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(log.timestamp)}</span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {Math.ceil(total / 25)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 25)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
