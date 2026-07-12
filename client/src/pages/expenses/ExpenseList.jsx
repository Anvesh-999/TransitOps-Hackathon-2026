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
  const limit = 15;

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
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
          message.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Log tolls, fines, insurances, parking, and miscellaneous operational costs</p>
        </div>
        {can('expenses:create') && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4.5 h-4.5" /> Add Expense
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Expenses (Page)</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalExpenseCost)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <span className="text-lg font-bold">🛒</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Active Logged Items</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{total} Records</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Category Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['All', ...EXPENSE_CATEGORIES].map((category) => (
              <button
                key={category}
                onClick={() => { setCategoryFilter(category); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Vehicle Dropdown Filter */}
          <div className="flex w-full md:w-auto gap-3 items-center">
            <select
              value={vehicleFilter}
              onChange={(e) => { setVehicleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white w-full md:w-48"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600">No expenses found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes / Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{e.vehicleId?.registrationNumber || '—'}</div>
                    <div className="text-xs text-gray-500">{e.vehicleId?.name || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">{e.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={e.notes}>{e.notes || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-bold">{formatCurrency(e.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(e.date)}</td>
                  <td className="px-6 py-4 text-right">
                    {can('expenses:delete') && (
                      <button
                        onClick={() => setShowDeleteDialog(e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Add Expense Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Fleet Expense" maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
            <select
              required
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
            >
              <option value="">Choose a vehicle...</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber} — {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Amount (INR)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 500"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Receipt details</label>
            <textarea
              rows="3"
              placeholder="e.g. Toll receipt #1234 Pune-Mumbai express route..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50">
              {saving ? 'Logging...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
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
