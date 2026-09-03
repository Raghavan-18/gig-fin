import TransactionCard from './TransactionCard';
import { CategoryIcon } from '../utils/categoryUtils';

export default function TransactionTable({
  transactions = [],
  emptyMessage = 'No transactions found matching your criteria.',
}) {
  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      {/* Mobile Card List View (< sm) */}
      <div className="space-y-2.5 sm:hidden">
        {transactions.map((t) => (
          <TransactionCard key={t.id} transaction={t} />
        ))}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Platform / Source</th>
              <th className="py-3.5 px-4">Classification</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {transactions.map((t) => {
              const isCredit = t.type === 'credit';

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-850/50 transition-colors"
                >
                  <td className="py-3.5 px-4 text-slate-400 font-mono whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <CategoryIcon category={t.category} type={t.type} className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate max-w-[180px]">{t.description}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {t.platform || 'Platform'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Rule-based
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 uppercase text-[11px] font-bold">
                    <span
                      className={
                        isCredit ? 'text-emerald-400' : 'text-slate-400'
                      }
                    >
                      {t.type}
                    </span>
                  </td>
                  <td
                    className={`py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap ${
                      isCredit ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isCredit ? `+₹${t.amount.toLocaleString('en-IN')}` : `-₹${t.amount.toLocaleString('en-IN')}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
