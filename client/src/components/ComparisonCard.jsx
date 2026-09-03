import Card from './Card';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { DHARA_COMPARISON } from '../data/dharaData';

export default function ComparisonCard({
  comparison = DHARA_COMPARISON,
  className = '',
  compact = false,
}) {
  const displayItems = compact ? comparison.dimensions.slice(0, 2) : comparison.dimensions;

  return (
    <Card className={`p-6 border-slate-800 text-left space-y-5 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white">
            {comparison.title}
          </h3>
          <p className="text-xs text-slate-400">{comparison.subtitle}</p>
        </div>

        <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25 self-start sm:self-auto">
          Paradigm Shift
        </span>
      </div>

      {/* Grid Comparison */}
      <div className="space-y-4">
        {displayItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {item.dimension}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Traditional (Red/Bad) */}
              <div className="p-3.5 rounded-xl bg-rose-950/15 border border-rose-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <span>TRADITIONAL (CALENDAR-INDEXED)</span>
                </div>
                <h4 className="text-xs font-semibold text-white">
                  {item.traditional.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.traditional.description}
                </p>
                <div className="pt-1 text-[10px] font-medium text-rose-300/80">
                  {item.traditional.impact}
                </div>
              </div>

              {/* Dhara (Green/Good) */}
              <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>DHARA (CASH-FLOW-INDEXED)</span>
                </div>
                <h4 className="text-xs font-semibold text-white">
                  {item.dhara.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {item.dhara.description}
                </p>
                <div className="pt-1 text-[10px] font-medium text-emerald-300">
                  {item.dhara.impact}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
