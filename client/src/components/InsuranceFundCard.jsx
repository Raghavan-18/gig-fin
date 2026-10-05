import Card from './Card';
import { ShieldCheck, Umbrella } from 'lucide-react';
import { DHARA_INSURANCE_FUND } from '../data/dharaData';

export default function InsuranceFundCard({
  backendSinking,
  fund = DHARA_INSURANCE_FUND,
  className = '',
}) {
  const target = backendSinking?.target || {};
  const title = target.label || fund.title;
  const amountAccumulated = Math.round(backendSinking?.balance ?? fund.amountAccumulated ?? 0);
  const targetPremiumAnnual = target.amount || fund.targetPremiumAnnual || 14000;
  const dailyAccrualRate = backendSinking?.daily_accrual || fund.dailyAccrualRate || 38;
  const progressPercentage = Math.min(100, Math.round((amountAccumulated / (targetPremiumAnnual || 1)) * 100));
  const remainingAmount = Math.max(0, targetPremiumAnnual - amountAccumulated);
  const daysToTarget = dailyAccrualRate > 0 ? Math.ceil(remainingAmount / dailyAccrualRate) : 365;

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
              {title}
            </h3>
            <p className="text-xs text-slate-400">Micro-insurance sinking fund · Never lapses on a bad week</p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 self-start sm:self-auto">
          {progressPercentage}% Funded
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        Continual micro-accruals ring-fence your annual protection policy so a temporary income shock or drought never causes your insurance to lapse.
      </p>

      {/* Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-slate-400 font-medium">Accumulated toward policy</span>
          <span className="font-mono font-bold text-white">
            ₹{amountAccumulated} / ₹{targetPremiumAnnual}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-950 p-0.5 border border-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Daily Accrual</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ₹{dailyAccrualRate}/day
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Remaining</span>
          <span className="text-xs font-bold text-white font-mono">
            ₹{remainingAmount}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
          <span className="text-[10px] text-slate-400 block">Estimated Completion</span>
          <span className="text-xs font-bold text-white font-mono">
            In {daysToTarget} days
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
