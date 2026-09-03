import Card from './Card';
import { PieChart } from 'lucide-react';

export default function ExpenseBreakdownChart({
  categories = [
    { name: 'Housing', amount: 5000, percent: 32.4, color: '#3b82f6' },
    { name: 'Food', amount: 3840, percent: 24.9, color: '#10b981' },
    { name: 'Fuel', amount: 3250, percent: 21.1, color: '#f59e0b' },
    { name: 'Bills', amount: 2150, percent: 13.9, color: '#8b5cf6' },
    { name: 'Other', amount: 1180, percent: 7.7, color: '#64748b' },
  ],
  title = 'Expense Category Breakdown',
}) {
  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Card className="p-6 border-slate-800 text-left">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-base sm:text-lg text-white">{title}</h3>
      </div>

      {/* Multi-segment horizontal bar */}
      <div className="w-full h-4 rounded-full bg-slate-850 overflow-hidden flex mb-6">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
            title={`${cat.name}: ${cat.percent}%`}
            className="h-full hover:opacity-85 transition-opacity"
          />
        ))}
      </div>

      {/* Category details rows */}
      <div className="space-y-3">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium text-slate-200">{cat.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400 text-xs">{cat.percent}%</span>
              <span className="font-bold text-white font-mono">
                ₹{cat.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
        <span className="text-slate-400">Total Operational Outflow:</span>
        <span className="font-bold text-sm text-white font-mono">
          ₹{total.toLocaleString('en-IN')}
        </span>
      </div>
    </Card>
  );
}
