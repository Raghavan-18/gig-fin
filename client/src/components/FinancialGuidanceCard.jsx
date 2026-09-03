import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function FinancialGuidanceCard({
  recommendations = [
    {
      id: 'g1',
      badge: 'Earnings Spike',
      title: 'Your earnings increased 20% this week.',
      description: 'Weekend incentives on Swiggy and Zomato generated ₹4,250.',
      actionRoute: '/savings',
      actionText: 'Save Surplus',
    },
    {
      id: 'g2',
      badge: 'Smart Buffer',
      title: 'Consider moving ₹200 toward your Bike Repair Fund.',
      description: 'Keeps you prepared before the upcoming monsoon delivery surge.',
      actionRoute: '/savings',
      actionText: 'Allocate ₹200',
    },
  ],
  className = '',
}) {
  const navigate = useNavigate();

  return (
    <Card className={`p-6 border-slate-800 text-left ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-base text-white">Financial Guidance</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/financial-guidance')}
          icon={ArrowRight}
          iconPosition="right"
        >
          View Guidance
        </Button>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 2).map((rec) => (
          <div
            key={rec.id}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {rec.badge}
              </span>
              <h4 className="text-xs sm:text-sm font-semibold text-white">
                {rec.title}
              </h4>
              <p className="text-xs text-slate-400">{rec.description}</p>
            </div>

            {rec.actionRoute && (
              <button
                type="button"
                onClick={() => navigate(rec.actionRoute)}
                className="self-start sm:self-center text-xs font-semibold text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors whitespace-nowrap"
              >
                {rec.actionText} →
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
