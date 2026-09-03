export default function TransactionFilter({
  activeFilter = 'All',
  onFilterChange,
  activeVerificationFilter = 'All',
  onVerificationFilterChange,
  categories = ['All', 'Income', 'Expenses', 'Fuel', 'Food', 'Maintenance', 'Other'],
  verificationFilters = [
    { id: 'All', label: 'All Sources' },
    { id: 'aa_verified', label: '✓ AA Verified' },
    { id: 'receipt_verified', label: '✓ Receipt Verified' },
    { id: 'self_reported', label: '⚠ Self Reported' },
    { id: 'synthetic_demo', label: 'DEMO · Synthetic' },
  ],
}) {
  return (
    <div className="space-y-3 w-full">
      {/* Category / Type Filter Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex-shrink-0">
          Category:
        </span>
        {categories.map((cat) => {
          const isSelected = activeFilter.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onFilterChange?.(cat)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none
                ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-500/50'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Verification / Source Provenance Filter Row (Requirement 14) */}
      {onVerificationFilterChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-800/60 pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex-shrink-0">
            Provenance:
          </span>
          {verificationFilters.map((vf) => {
            const isSelected =
              activeVerificationFilter.toLowerCase() === vf.id.toLowerCase();
            return (
              <button
                key={vf.id}
                type="button"
                onClick={() => onVerificationFilterChange?.(vf.id)}
                className={`
                  px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer select-none
                  ${
                    isSelected
                      ? 'bg-slate-800 text-blue-300 shadow-sm border border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'bg-slate-950/70 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }
                `}
              >
                {vf.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
