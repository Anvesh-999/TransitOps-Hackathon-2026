/**
 * Empty State — shown when data lists are empty.
 * Usage: <EmptyState icon={Truck} title="No vehicles" message="Add your first vehicle." />
 */
const EmptyState = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="text-center py-16">
      {Icon && <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
      {action && action}
    </div>
  );
};

export default EmptyState;
