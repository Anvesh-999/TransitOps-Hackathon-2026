// TODO: Dev 4 — Complete Reports page with chart.js visualizations
import { BarChart3 } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-700 mb-2">Reports Module</h2>
        <p className="text-gray-500 text-sm">Vehicle utilization, fuel efficiency, operational cost, and driver statistics reports will be rendered here with Chart.js.</p>
      </div>
    </div>
  );
};

export default Reports;
