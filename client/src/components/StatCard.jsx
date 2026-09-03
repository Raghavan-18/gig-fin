import Card from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  amount,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  variant = 'default',
  className = '',
}) {
  const iconColors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <Card className={`p-5 text-left border-slate-800 transition-all ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              iconColors[variant] || iconColors.default
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : amount}
        </h3>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                trend > 0
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}
            >
              {trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </span>
          )}
          <span className="text-slate-400 truncate">{trendLabel || subtitle}</span>
        </div>
      )}
    </Card>
  );
}
