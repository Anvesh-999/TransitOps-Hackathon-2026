// TODO: Dev 4 — Complete Expense page
import { useState, useEffect } from 'react';
import { expenseService } from '../../services/finance.service';
import { Receipt, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseService.getAll({ limit: 50 }).then((res) => { setExpenses(res.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200"><tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((e) => (
              <tr key={e._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{e.vehicleId?.registrationNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{e.category}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(e.amount)}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{e.notes || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(e.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <div className="text-center py-12 text-gray-400"><Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No expenses</p></div>}
      </div>
    </div>
  );
};

export default ExpenseList;
