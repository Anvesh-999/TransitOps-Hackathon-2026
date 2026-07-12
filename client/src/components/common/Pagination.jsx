/**
 * Pagination — renders Previous/Next buttons with page info.
 * Usage: <Pagination page={1} total={50} limit={20} onPageChange={setPage} />
 */
const Pagination = ({ page, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} items
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all outline-none"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all outline-none"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
