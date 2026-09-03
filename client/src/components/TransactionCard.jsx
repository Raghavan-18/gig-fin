import { CategoryIcon } from '../utils/categoryUtils';
import VerificationBadge from './VerificationBadge';
import { Paperclip } from 'lucide-react';

export default function TransactionCard({ transaction, onClick, className = '' }) {
  const isCredit = transaction.type === 'credit';
  const hasReceipt = Boolean(transaction.receipt_present || transaction.receipt_id);

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-850/50 transition-all cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isCredit
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          <CategoryIcon category={transaction.category} type={transaction.type} className="w-5 h-5" />
        </div>

        <div className="text-left overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {transaction.description}
            </h4>
            {hasReceipt && (
              <span title="Receipt attached" className="flex-shrink-0">
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
              {transaction.date}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {transaction.category}
            </span>
            <span className="text-slate-600">•</span>
            <VerificationBadge
              status={transaction.verification_status}
              size="xs"
            />
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0 pl-2">
        <div
          className={`text-sm sm:text-base font-extrabold font-mono ${
            isCredit ? 'text-emerald-400' : 'text-slate-200'
          }`}
        >
          {isCredit ? `+₹${transaction.amount.toLocaleString('en-IN')}` : `-₹${transaction.amount.toLocaleString('en-IN')}`}
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
          {transaction.type}
        </span>
      </div>
    </div>
  );
}
