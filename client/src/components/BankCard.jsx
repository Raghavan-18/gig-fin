import { CheckCircle2, Building2 } from 'lucide-react';

export default function BankCard({ bank, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(bank)}
      className={`
        relative flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 select-none
        border
        ${
          isSelected
            ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]'
            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
        }
      `}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-md"
          style={{ backgroundColor: bank.logoBg || '#1e293b', color: bank.textColor || '#fff' }}
        >
          {bank.shortName.substring(0, 4)}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-white text-base">{bank.name}</h4>
            {bank.popular && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                Popular
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>AA Enabled • Instant Connect</span>
          </p>
        </div>
      </div>

      <div className="flex items-center">
        {isSelected ? (
          <CheckCircle2 className="w-6 h-6 text-blue-400 fill-blue-400/20" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
        )}
      </div>
    </div>
  );
}
