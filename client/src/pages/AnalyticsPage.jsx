import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ForecastChart from '../components/ForecastChart';
import SimulationBadge from '../components/SimulationBadge';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import Card from '../components/Card';
import {
  TrendingUp,
  Activity,
  Zap,
  Sparkles,
  Layers,
  Info,
  Calendar,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [categories] = useState([
    { name: 'Housing (Rent)', amount: 5000, percentage: 32, color: '#3b82f6' },
    { name: 'Food & Meals', amount: 4320, percentage: 28, color: '#10b981' },
    { name: 'Motorcycle Fuel', amount: 3550, percentage: 23, color: '#f59e0b' },
    { name: 'Utility Bills', amount: 1650, percentage: 11, color: '#8b5cf6' },
    { name: 'Maintenance / Other', amount: 900, percentage: 6, color: '#64748b' },
  ]);

  const [incomeSplit] = useState({
    gigIncome: 23600,
    otherIncome: 1250,
    gigPercent: 95,
    otherPercent: 5,
  });

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Income & Cash Flow Forecast"
            subtitle="Quantile forecasting, volatility modeling, and cash-flow behavior over synthetic dataset"
            badge="Dhara ML / Quantile Engine"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* 4 Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Monthly Gross"
            amount={24850}
            trend={{ value: '18% weekly surge', isPositive: true }}
            icon={TrendingUp}
            variant="blue"
            description="30-day settled aggregate"
          />

          <StatCard
            title="Average Daily Income"
            amount={828}
            trend={{ value: '₹1,250 today', isPositive: true }}
            icon={Calendar}
            variant="emerald"
            description="Across 30 active delivery shifts"
          />

          <StatCard
            title="Income Consistency"
            value="82%"
            trend={{ value: 'Moderate volatility', isPositive: true }}
            icon={Activity}
            variant="amber"
            description="Weekend vs weekday variance"
          />

          <StatCard
            title="Highest Earning Day"
            amount={1850}
            trend={{ value: 'Rain surge bonus', isPositive: true }}
            icon={Zap}
            variant="purple"
            description="Triggered surge skim"
          />
        </div>

        {/* Forecast Visualization (p10, p20, p50, p90) */}
        <div>
          <ForecastChart />
        </div>

        {/* Quantile Model Explanation & Volatility Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 border-slate-800 text-left space-y-4 lg:col-span-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">
                  Quantile Architecture
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than using a misleading single average, Dhara's quantile forecaster predicts a probability band:
              </p>

              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-blue-400">p20 Conservative: </span>
                  <span className="text-slate-300">Used as the denominator in the Safe-to-Save equation.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-emerald-400">p50 Median: </span>
                  <span className="text-slate-300">Expected baseline income for operational planning.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-purple-400">p90 Peak: </span>
                  <span className="text-slate-300">Triggers Surge Skim sweeps into liquid emergency fund.</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-300">
              Structured to receive backend forecast tensors without frontend UI redesign.
            </div>
          </Card>

          {/* Platform Income Split & Volatility */}
          <Card className="p-6 border-slate-800 text-left space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">
                  Income Inflow Classification
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                Rule-based Classifier
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Gig Platform Payouts: {incomeSplit.gigPercent}%
                </span>
                <span className="text-slate-400 font-mono">
                  ₹{incomeSplit.gigIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-l-full"
                  style={{ width: `${incomeSplit.gigPercent}%` }}
                />
                <div
                  className="h-full bg-emerald-500 rounded-r-full"
                  style={{ width: `${incomeSplit.otherPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Swiggy & Zomato Settlements (95%)</span>
                <span>Peer UPI (5%)</span>
              </div>
            </div>

            {/* Pattern Intelligence Insight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 flex items-start gap-3 mt-4">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">
                  Cash-Flow Stability Assessment
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Your daily income exhibits weekend surge peaks (up to ₹1,850) followed by midweek troughs (₹780–₹980).
                  Because Dhara sweeps are paused on days below ₹600, your buffer remains healthy across all 30 days.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Expense Category Breakdown */}
        <div>
          <ExpenseBreakdownChart
            categories={categories}
            title="Operational Burn & Obligation Breakdown"
          />
        </div>
      </div>
    </AppLayout>
  );
}
