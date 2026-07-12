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
  const limit = 15;

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
    if (!prev && !curr) return <p className="text-xs text-slate-400 dark:text-slate-500 italic">No change details available</p>;

    const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(curr || {})]);
    const changes = [];

    allKeys.forEach((key) => {
      const oldVal = prev?.[key];
      const newVal = curr?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ key, oldVal, newVal });
      }
    });

    if (changes.length === 0) return <p className="text-xs text-slate-450 dark:text-slate-500 italic">No value changes</p>;

    return (
      <div className="space-y-1.5">
        {changes.map((c) => (
          <div key={c.key} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-slate-500 dark:text-slate-400 w-28 truncate">{c.key}</span>
            {c.oldVal !== undefined && (
              <span className="bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded font-mono line-through">{String(c.oldVal)}</span>
            )}
            <span className="text-slate-400 dark:text-slate-500">→</span>
            {c.newVal !== undefined && (
              <span className="bg-green-50 dark:bg-green-955/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-mono">{String(c.newVal)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review operational breakdowns, system action histories, and trace log diffs</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">Entity Type</label>
              <select
                value={entityFilter}
                onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
              >
                {ENTITY_TYPES.map((e) => <option key={e} value={e} className="bg-white dark:bg-slate-900">{e}</option>)}
              </select>
            </div>

            {/* User Search */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">User</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-455 mb-1.5 uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {(entityFilter !== 'All' || searchUser || startDate || endDate) && (
            <button onClick={clearFilters} className="text-xs text-primary dark:text-blue-400 font-semibold hover:underline">Clear all filters</button>
          )}
        </div>
      )}

      {/* Logs List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl">
            <FileText className="w-16 h-16 text-slate-350 dark:text-slate-705 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No activity logs found</p>
            <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-850">
            {filteredLogs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || { emoji: '📝', text: log.action };
              const isExpanded = expandedId === log._id;

              return (
                <div key={log._id}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isExpanded
                        ? 'bg-blue-50/20 dark:bg-blue-950/10'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{actionInfo.emoji}</span>
                      <div>
                        <p className="text-sm text-slate-800 dark:text-slate-250">
                          <span className="font-bold text-slate-950 dark:text-slate-100">{log.userId?.name || 'System'}</span>
                          <span className="text-slate-500 dark:text-slate-400"> — {actionInfo.text}</span>
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-655 dark:text-slate-400">{log.entityType}</span>
                          <span className="font-mono">ID: ...{log.entityId?.toString().slice(-6)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 dark:text-slate-450 font-medium whitespace-nowrap">{timeAgo(log.timestamp)}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-4 pt-0 pl-16 animate-fade-in">
                      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/10 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase mb-2">Change Details</p>
                        {renderDiff(log)}
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-200/10">{formatDateTime(log.timestamp)}</p>
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
