export default function TransactionFilter({
  currentFilter = 'All',
  onFilterChange,
  filters = ['All', 'Income', 'Expenses', 'Fuel', 'Food', 'Bills', 'Other'],
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {filters.map((f) => {
        const isSelected = currentFilter.toLowerCase() === f.toLowerCase();
        return (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`
              px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none
              ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }
            `}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}
