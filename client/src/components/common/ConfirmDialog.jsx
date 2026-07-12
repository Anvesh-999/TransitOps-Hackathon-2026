/**
 * Confirm Dialog — used for destructive actions (delete, cancel, etc.)
 * Usage: <ConfirmDialog isOpen onConfirm={handleDelete} onCancel={handleClose} title="Delete Vehicle?" message="This cannot be undone." />
 */
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500/20',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/20',
    primary: 'bg-primary hover:bg-primary-dark focus:ring-primary/20',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>

      {/* Box */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6 text-center z-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        {message && <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed">{message}</p>}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all focus:ring-4 outline-none ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
