import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { PiggyBank, Sparkles, Check } from 'lucide-react';

export default function SavingsRecommendation({
  todayEarnings = 1250,
  recommendedAmount = 62,
  ruleDescription = 'Based on your savings rule, we recommend saving ₹62.',
  targetGoalName = 'Bike Repair Fund',
  onSaveAmount,
  className = '',
}) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    if (onSaveAmount) {
      await onSaveAmount(recommendedAmount);
    }
    setLoading(false);
    setSaved(true);
  };

  return (
    <Card className={`p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-slate-900 to-slate-900 text-left relative overflow-hidden shadow-xl ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <PiggyBank className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Smart Savings Rule
        </span>
      </div>

      <div className="space-y-1 mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          You received ₹{todayEarnings.toLocaleString('en-IN')} today.
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {ruleDescription}
        </p>
        <span className="text-xs text-slate-400 block pt-1">
          Auto-allocated toward:{' '}
          <strong className="text-emerald-300">{targetGoalName}</strong>
        </span>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {saved ? (
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
            <Check className="w-4 h-4" />
            <span>₹{recommendedAmount} Added to {targetGoalName}!</span>
          </div>
        ) : (
          <Button
            variant="emerald"
            size="md"
            loading={loading}
            onClick={handleSave}
            icon={Sparkles}
            iconPosition="left"
          >
            Add ₹{recommendedAmount} to Goal
          </Button>
        )}

        <span className="text-[11px] text-slate-500">
          Virtual simulation • No funds debited
        </span>
      </div>
    </Card>
  );
}
