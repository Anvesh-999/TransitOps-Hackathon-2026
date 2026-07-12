/**
 * Confirm Dialog — used for destructive actions (delete, cancel, etc.)
 * Usage: <ConfirmDialog isOpen onConfirm={handleDelete} onCancel={handleClose} title="Delete Vehicle?" message="This cannot be undone." />
 */
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    primary: 'bg-primary hover:bg-primary-dark',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          {message && <p className="text-sm text-gray-500 mb-6">{message}</p>}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
