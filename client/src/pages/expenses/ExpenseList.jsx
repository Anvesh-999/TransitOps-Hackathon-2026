import { useState, useEffect } from 'react';
import { expenseService } from '../../services/finance.service';
import { vehicleService } from '../../services/vehicle.service';
import { useAuth } from '../../contexts/AuthContext';
import { Receipt, Plus, Trash2, Search, Filter } from 'lucide-react';
import { Modal, ConfirmDialog, Pagination, StatusBadge } from '../../components/common';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ExpenseList = () => {
  const { can } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Dialogs
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State
  const [form, setForm] = useState({
    vehicleId: '',
    category: 'Toll',
    amount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (vehicleFilter !== 'All') params.vehicleId = vehicleFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await expenseService.getAll(params);
      setExpenses(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await vehicleService.getAll({ limit: 100 });
      setVehicles(res.data.data.filter((v) => v.status !== 'Retired'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [page, categoryFilter, vehicleFilter, startDate, endDate]);

  useEffect(() => {
    if (showModal) {
      fetchVehicles();
    }
  }, [showModal]);

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setForm({
      vehicleId: '',
      category: 'Toll',
      amount: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await expenseService.create(form);
      showToast('Expense log added successfully');
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to add expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expenseService.remove(showDeleteDialog._id);
      showToast('Expense log deleted successfully');
      setShowDeleteDialog(null);
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to delete expense', 'error');
    }
  };

  // Summary Metrics
  const totalExpenseCost = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in border ${
          message.type === 'error'
            ? 'bg-red-650 border-red-500 text-white'
            : 'bg-emerald-600 border-emerald-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Operational Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Log tolls, fines, insurances, parking, and miscellaneous operational costs</p>
        </div>
        {can('expenses:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Plus className="w-5 h-5" /> Add Expense
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100/10 dark:bg-rose-955/20 border border-rose-200/20 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-455 dark:text-slate-450 uppercase font-semibold">Total Expenses (Page)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalExpenseCost)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100/10 dark:bg-indigo-950/40 border border-indigo-200/20 rounded-xl flex items-center justify-center text-indigo-650 dark:text-indigo-400">
            <span className="text-lg font-bold">🛒</span>
          </div>
          <div>
            <p className="text-xs text-slate-455 dark:text-slate-450 uppercase font-semibold">Active Logged Items</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{total} Records</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
          {/* Category Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full xl:w-auto overflow-x-auto border border-slate-200/10">
            {['All', ...EXPENSE_CATEGORIES].map((category) => (
              <button
                key={category}
                onClick={() => { setCategoryFilter(category); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Vehicle Dropdown Filter */}
          <div className="flex w-full xl:w-auto gap-3 items-center">
            <select
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-850 dark:text-slate-250 bg-white"
            >
              <option value="All">All Vehicles</option>
              {expenses.map((exp) => exp.vehicleId).filter((v, idx, self) => v && self.findIndex(t => t._id === v._id) === idx).map((v) => (
                <option key={v._id} value={v._id}>{v.registrationNumber}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Receipt className="w-16 h-16 text-slate-350 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-750 dark:text-slate-350">No expenses found</p>
              <p className="text-sm text-slate-450 dark:text-slate-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Notes / Description</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-455 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{e.vehicleId?.registrationNumber || '—'}</div>
                      <div className="text-xs text-slate-550 dark:text-slate-455 mt-0.5">{e.vehicleId?.name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded text-xs font-semibold">{e.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-400 max-w-xs truncate" title={e.notes}>{e.notes || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-bold">{formatCurrency(e.amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">{formatDate(e.date)}</td>
                    <td className="px-6 py-4 text-right">
                      {can('expenses:delete') && (
                        <button
                          onClick={() => setShowDeleteDialog(e)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-600 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fleet Expense" maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Select Vehicle</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="" className="bg-white dark:bg-slate-900">Choose a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id} className="bg-white dark:bg-slate-900">
                  {v.registrationNumber} — {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Expense Amount (INR)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1">Notes / Receipt details</label>
            <textarea
              rows="3"
              placeholder="e.g. Toll receipt #1234 Pune-Mumbai express route..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-55 dark:bg-slate-955/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
              {saving ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showDeleteDialog}
        onCancel={() => setShowDeleteDialog(null)}
        onConfirm={handleDelete}
        title="Delete Expense Log?"
        message={`Are you sure you want to delete this expense of ${formatCurrency(showDeleteDialog?.amount)}? Doing so will recalculate total expenses.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ExpenseList;
