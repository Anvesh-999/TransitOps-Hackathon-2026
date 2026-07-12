import { STATUS_COLORS } from '../../utils/constants';

/**
 * Status Badge — renders a colored pill for any status value.
 * Usage: <StatusBadge status="Available" />
 */
const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
