import Card from './Card';
import { RefreshCw, Shield, Info } from 'lucide-react';
import { DHARA_CREDIT_RESILIENCE } from '../data/dharaData';

export default function RepaymentCard({
  repayment = DHARA_CREDIT_RESILIENCE.incomeLinkedRepayment,
  className = '',
}) {
  return (
    <Card className={`p-6 border-slate-800 text-left space-y-4 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Income-Linked Repayment Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Zero bounce fees · Dynamic calibration scaled to daily settled payout
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-300 border border-slate-800">
          Daily Cap: ₹{repayment.dailyCeiling}
        </span>
      </div>

      {/* Formula Concept Pill */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="font-mono text-indigo-300 font-semibold">
            {repayment.rule}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline-block">
          rate = {repayment.ratePercentage}% of daily gross
        </span>
      </div>

      {/* 4 Day Scenarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {repayment.scenarios.map((scen, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-2"
          >
            <div>
              <span className="text-xs font-bold text-slate-200 block truncate">
                {scen.dayType}
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {scen.formula}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850 flex items-baseline justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Repayment:
              </span>
              <span
                className={`font-mono font-extrabold text-sm ${
                  scen.repayment === 0 ? 'text-emerald-400' : 'text-white'
                }`}
              >
                ₹{scen.repayment}
              </span>
            </div>
            <span className="text-[10px] text-indigo-400/80 font-medium">
              {scen.note}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Insight */}
      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2.5 text-xs text-indigo-200">
        <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p>
          Unlike rigid bank EMIs where a ₹0 day triggers an NACH bounce fee of ₹500,
          Dhara ensures that zero earnings equate to ₹0 deduction with zero penalties.
        </p>
      </div>
    </Card>
  );
}
