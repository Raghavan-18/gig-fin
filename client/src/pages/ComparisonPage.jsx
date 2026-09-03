import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import ComparisonCard from '../components/ComparisonCard';
import SimulationBadge from '../components/SimulationBadge';
import Card from '../components/Card';
import { DHARA_COMPARISON } from '../data/dharaData';
import {
  Calendar,
  Zap,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

export default function ComparisonPage() {
  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Traditional vs Dhara"
            subtitle="Calendar-indexed rigidity vs Cash-flow-indexed financial resilience"
            badge="Dhara Core Thesis"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Hero Thesis Banner */}
        <Card className="p-6 sm:p-8 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 shadow-2xl text-left space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              The Fundamental Mismatch in Indian Gig Finance
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Gig delivery partners and drivers earn on an unpredictable day-to-day cycle driven by weather,
            surge bonuses, and weekend spikes. Yet every existing banking product is <strong>calendar-indexed</strong>—demanding
            fixed payments on fixed dates regardless of cashflow reality.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <Calendar className="w-4 h-4" />
                <span>Traditional: Calendar-Indexed</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Requires fixed-date payments. When a slow week or motorcycle breakdown hits, payments bounce, incurring ₹500 bank fees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>Dhara: Cash-Flow-Indexed</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deductions and savings scale continuously with actual daily settled inflows. On slow or zero-income days, deductions automatically drop to ₹0.
              </p>
            </div>
          </div>
        </Card>

        {/* Complete 4-Dimension Detailed Comparison */}
        <div>
          <ComparisonCard comparison={DHARA_COMPARISON} compact={false} />
        </div>

        {/* Micro-Simulation Scenario: The Monsoon Week Stress Test */}
        <Card className="p-6 border-slate-800 text-left space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                Stress Scenario: 4-Day Rain Downtime
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Demo Comparison Engine
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Simulated outcome of a delivery rider who suffers heavy rain downtime during the 1st week of the month:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <TrendingDown className="w-4 h-4" />
                <span>Traditional Bank Outcome</span>
              </div>
              <ul className="space-y-1 text-slate-400 list-disc list-inside">
                <li>Fixed EMI auto-debit triggers on 5th Sep</li>
                <li>Insufficient balance causes NACH bounce</li>
                <li>Bank levies ₹500 bounce charge + lender penalty</li>
                <li>Worker forced into high-interest local informal debt</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>Dhara Engine Outcome</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                <li>Safe-to-Save detects rain trough and pauses sweeps</li>
                <li>Repayment automatically clamps to ₹0 during downtime</li>
                <li>Liquid sweep buffer absorbs essential meal & fuel burn</li>
                <li>Zero bounce charges, zero credit distress</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
