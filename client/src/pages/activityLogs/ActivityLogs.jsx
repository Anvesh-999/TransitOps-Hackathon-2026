import { useState, useEffect } from 'react';
import { activityLogService } from '../../services/admin.service';
import { FileText, Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { timeAgo, formatDateTime } from '../../utils/formatters';
import { Pagination } from '../../components/common';

const ENTITY_TYPES = ['All', 'Vehicle', 'Driver', 'Trip', 'Maintenance', 'FuelLog', 'Expense', 'User', 'Notification'];

const ACTION_LABELS = {
  'vehicle.create': { emoji: '🚛', text: 'Created vehicle' },
  'vehicle.update': { emoji: '✏️', text: 'Updated vehicle' },
  'vehicle.delete': { emoji: '🗑️', text: 'Deleted vehicle' },
  'vehicle.statusChange': { emoji: '🔄', text: 'Changed vehicle status' },
  'driver.create': { emoji: '👤', text: 'Added driver' },
  'driver.update': { emoji: '✏️', text: 'Updated driver' },
  'driver.delete': { emoji: '🗑️', text: 'Removed driver' },
  'driver.suspend': { emoji: '⚠️', text: 'Suspended driver' },
  'driver.statusChange': { emoji: '🔄', text: 'Changed driver status' },
  'trip.create': { emoji: '📋', text: 'Created trip' },
  'trip.dispatch': { emoji: '🚀', text: 'Dispatched trip' },
  'trip.complete': { emoji: '✅', text: 'Completed trip' },
  'trip.cancel': { emoji: '❌', text: 'Cancelled trip' },
  'maintenance.create': { emoji: '🔧', text: 'Created maintenance' },
  'maintenance.close': { emoji: '✅', text: 'Closed maintenance' },
  'maintenance.update': { emoji: '✏️', text: 'Updated maintenance' },
  'fuelLog.create': { emoji: '⛽', text: 'Added fuel log' },
  'fuelLog.delete': { emoji: '🗑️', text: 'Deleted fuel log' },
  'expense.create': { emoji: '💰', text: 'Added expense' },
  'expense.delete': { emoji: '🗑️', text: 'Deleted expense' },
  'user.login': { emoji: '🔑', text: 'Logged in' },
  'user.create': { emoji: '👤', text: 'Created user' },
  'user.update': { emoji: '✏️', text: 'Updated user' },
  'user.resetPassword': { emoji: '🔐', text: 'Reset password' },
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filters
  const [entityFilter, setEntityFilter] = useState('All');
  const [searchUser, setSearchUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Expanded row
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (entityFilter !== 'All') params.entityType = entityFilter;
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const res = await activityLogService.getAll(params);
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('ActivityLog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logs by username (client-side for simplicity)
  const filteredLogs = searchUser
    ? logs.filter((l) => l.userId?.name?.toLowerCase().includes(searchUser.toLowerCase()))
    : logs;

  const clearFilters = () => {
    setEntityFilter('All');
    setSearchUser('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const renderDiff = (log) => {
    const prev = log.previousValue;
    const curr = log.currentValue;
    if (!prev && !curr) return <p className="text-xs text-gray-400 italic">No change details available</p>;

    const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(curr || {})]);
    const changes = [];

    allKeys.forEach((key) => {
      const oldVal = prev?.[key];
      const newVal = curr?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ key, oldVal, newVal });
      }
    });

    if (changes.length === 0) return <p className="text-xs text-gray-400 italic">No value changes</p>;

    return (
      <div className="space-y-1.5">
        {changes.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-gray-500 w-28 truncate">{c.key}</span>
            {c.oldVal !== undefined && (
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono line-through">{String(c.oldVal)}</span>
            )}
            <span className="text-gray-400">→</span>
            {c.newVal !== undefined && (
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">{String(c.newVal)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Entity Type</label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {ENTITY_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {/* User Search */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">User</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {(entityFilter !== 'All' || searchUser || startDate || endDate) && (
            <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all filters</button>
          )}
        </div>
      )}

      {/* Logs List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-16 h-16 mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No activity logs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLogs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || { emoji: '📝', text: log.action };
              const isExpanded = expandedId === log._id;

              return (
                <div key={log._id}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isExpanded ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{actionInfo.emoji}</span>
                      <div>
                        <p className="text-sm text-gray-800">
                          <span className="font-semibold">{log.userId?.name || 'System'}</span>
                          <span className="text-gray-500"> — {actionInfo.text}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium text-gray-500">{log.entityType}</span>
                          <span>ID: ...{log.entityId?.toString().slice(-6)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-0 pl-16 animate-fade-in">
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Change Details</p>
                        {renderDiff(log)}
                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">{formatDateTime(log.timestamp)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
    </div>
  );
};

export default ActivityLogs;
