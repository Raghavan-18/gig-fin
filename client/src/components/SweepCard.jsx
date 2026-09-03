import Card from './Card';
import { Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { DHARA_SMART_SWEEPS } from '../data/dharaData';

export default function SweepCard({
  sweeps = DHARA_SMART_SWEEPS,
  className = '',
  onManageSweeps,
}) {
  return (
    <Card className={`p-6 border-slate-800 text-left space-y-4 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Smart Sweeps Engine
            </h3>
            <p className="text-xs text-slate-400">
              Cash-flow-indexed micro-savings with automatic pause protection
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase self-start sm:self-auto ${
            sweeps.todayStatus === 'PAUSED'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {sweeps.todayStatus === 'PAUSED' ? 'Sweeps Paused Today' : 'Sweeps Active'}
        </span>
      </div>

      {/* Paused Protection Notice */}
      {sweeps.todayStatus === 'PAUSED' && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Paused to protect your buffer</p>
            <p className="text-slate-400 mt-0.5">{sweeps.pauseReason}</p>
          </div>
        </div>
      )}

      {/* 3 Sweep Strategies */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {sweeps.strategies.map((strat) => (
          <div
            key={strat.id}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-2"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{strat.name}</span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  {strat.percentage ? `${strat.percentage}%` : `₹${strat.step}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                {strat.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-500">Accumulated</span>
              <span className="font-mono font-bold text-white">
                ₹{strat.accumulated.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Strip */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Total sweeps accumulated in liquid buffer:{' '}
            <strong className="text-white font-mono">
              ₹{sweeps.totalAccumulated.toLocaleString('en-IN')}
            </strong>
          </span>
        </div>

        {onManageSweeps && (
          <button
            type="button"
            onClick={onManageSweeps}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Sweep Rules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
}
