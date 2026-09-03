import { useState } from 'react';
import Card from './Card';
import { BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function CashFlowChart({
  initialTimeframe = 'daily',
  data = {
    daily: [
      { label: 'Mon', income: 980, expense: 540 },
      { label: 'Tue', income: 1150, expense: 620 },
      { label: 'Wed', income: 780, expense: 410 },
      { label: 'Thu', income: 1420, expense: 780 },
      { label: 'Fri', income: 1350, expense: 890 },
      { label: 'Sat', income: 1850, expense: 920 },
      { label: 'Sun', income: 1650, expense: 750 },
    ],
    weekly: [
      { label: 'Week 1', income: 5800, expense: 3900 },
      { label: 'Week 2', income: 6450, expense: 4100 },
      { label: 'Week 3', income: 5200, expense: 3200 },
      { label: 'Week 4', income: 7400, expense: 4220 },
    ],
    monthly: [
      { label: 'May', income: 21200, expense: 14200 },
      { label: 'Jun', income: 22800, expense: 14900 },
      { label: 'Jul', income: 23400, expense: 15100 },
      { label: 'Aug', income: 24850, expense: 15420 },
    ],
  },
  showFilters = true,
  title = 'Cash Flow: Income vs Expenses',
  subtitle = 'Track cash inflows against daily operational costs',
}) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const series = data[timeframe] || data.daily;
  const maxVal = Math.max(
    ...series.map((d) => Math.max(d.income, d.expense)),
    1000
  );

  const totalPeriodIncome = series.reduce((acc, d) => acc + d.income, 0);
  const totalPeriodExpense = series.reduce((acc, d) => acc + d.expense, 0);

  return (
    <Card className="p-6 border-slate-800 text-left">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base sm:text-lg text-white">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {showFilters && (
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
            {['daily', 'weekly', 'monthly'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer
                  ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick summary stats banner */}
      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Inflow (Income)</span>
            <span className="text-sm font-bold text-emerald-400">
              ₹{totalPeriodIncome.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Outflow (Expenses)</span>
            <span className="text-sm font-bold text-rose-400">
              ₹{totalPeriodExpense.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* SVG / CSS Bar Chart Container */}
      <div className="h-56 sm:h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-800/80 relative">
        {/* Background horizontal guide lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
          <div className="border-b border-slate-500 w-full" />
          <div className="border-b border-slate-500 w-full" />
          <div className="border-b border-slate-500 w-full" />
        </div>

        {series.map((item, idx) => {
          const incomeHeight = Math.max((item.income / maxVal) * 100, 4);
          const expenseHeight = Math.max((item.expense / maxVal) * 100, 4);
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-center pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold text-slate-300">{item.label}</div>
                  <div className="text-[11px] font-bold text-emerald-400">
                    +₹{item.income.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] font-bold text-rose-400">
                    -₹{item.expense.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              {/* Side by side comparison bars */}
              <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                {/* Income Bar (Emerald) */}
                <div
                  className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-300 group-hover:brightness-125"
                  style={{ height: `${incomeHeight}%` }}
                />

                {/* Expense Bar (Rose) */}
                <div
                  className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-rose-600 to-red-400 transition-all duration-300 group-hover:brightness-125"
                  style={{ height: `${expenseHeight}%` }}
                />
              </div>

              {/* X Axis Label */}
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-2 transition-colors group-hover:text-white">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-teal-400" />
          <span>Income (Earnings)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-rose-500 to-red-400" />
          <span>Expenses (Fuel, Food, EMI)</span>
        </div>
      </div>
    </Card>
  );
}
