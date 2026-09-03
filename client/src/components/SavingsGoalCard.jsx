import Card from './Card';
import { Wrench, ShieldAlert, Bike, Target, CheckCircle2 } from 'lucide-react';

const ICONS = {
  Wrench,
  ShieldAlert,
  Bike,
  Target,
};

export default function SavingsGoalCard({
  goal,
  onAddFunds,
  className = '',
}) {
  const Icon = ICONS[goal.iconName] || Target;
  const percent = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100
  );
  const isCompleted = goal.currentAmount >= goal.targetAmount;

  return (
    <Card className={`p-5 text-left border-slate-800 transition-all ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: goal.color || '#3b82f6' }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">{goal.name}</h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {goal.category}
            </span>
          </div>
        </div>

        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Target Achieved</span>
          </span>
        ) : (
          <span className="text-xs font-bold text-blue-400 font-mono">
            {percent}%
          </span>
        )}
      </div>

      {/* Amounts */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-extrabold text-white font-mono">
            ₹{goal.currentAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            of ₹{goal.targetAmount.toLocaleString('en-IN')}
          </span>
        </div>
        {goal.targetDate && (
          <span className="text-[11px] text-slate-500 font-mono">
            Target: {goal.targetDate}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: goal.color || '#3b82f6',
          }}
        />
      </div>

      {/* Footer action */}
      {onAddFunds && (
        <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
          <span className="text-slate-400">Remaining: ₹{(goal.targetAmount - goal.currentAmount).toLocaleString('en-IN')}</span>
          <button
            type="button"
            onClick={() => onAddFunds(goal)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            + Add Funds
          </button>
        </div>
      )}
    </Card>
  );
}
