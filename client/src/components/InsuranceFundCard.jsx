import Card from './Card';
import { ShieldCheck, Umbrella } from 'lucide-react';
import { DHARA_INSURANCE_FUND } from '../data/dharaData';

export default function InsuranceFundCard({
  fund = DHARA_INSURANCE_FUND,
  className = '',
}) {
  return (
    <Card className={`p-6 border-slate-800 text-left space-y-4 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Umbrella className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              {fund.title}
            </h3>
            <p className="text-xs text-slate-400">{fund.purpose}</p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 self-start sm:self-auto">
          {fund.progressPercentage}% Funded
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{fund.explanation}</p>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-400 font-medium">Accumulated toward policy</span>
          <span className="font-mono font-bold text-white">
            ₹{fund.amountAccumulated} / ₹{fund.targetPremiumAnnual}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-950 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${fund.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Daily Accrual</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ₹{fund.dailyAccrualRate}/day
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Remaining</span>
          <span className="text-xs font-bold text-white font-mono">
            ₹{fund.remainingAmount}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Estimated Completion</span>
          <span className="text-xs font-bold text-white font-mono">
            In {fund.daysToTarget} days
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Policy Status</span>
          <span className="text-xs font-bold text-teal-300">Active Buffer</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
        <span>Eliminates the risk of policy lapses during lean earning months</span>
      </div>
    </Card>
  );
}
