import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import { Award, ArrowRight } from 'lucide-react';

export default function GigScoreCard({
  score = 742,
  maxScore = 900,
  tier = 'GOOD',
  className = '',
}) {
  const navigate = useNavigate();
  const percent = Math.round((score / maxScore) * 100);

  return (
    <Card className={`p-6 border-slate-800 text-left relative overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Gig Score Preview
          </span>
        </div>

        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          {tier}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {score}
            </span>
            <span className="text-sm font-semibold text-slate-500">
              / {maxScore}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top 18% of delivery partners in your cluster
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/gig-score')}
          icon={ArrowRight}
          iconPosition="right"
        >
          View Score
        </Button>
      </div>

      {/* Progress Track */}
      <div className="space-y-1.5 pt-2">
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>Needs Work (300)</span>
          <span>Fair (650)</span>
          <span className="text-emerald-400 font-bold">Good (742)</span>
          <span>Excellent (900)</span>
        </div>
      </div>
    </Card>
  );
}
