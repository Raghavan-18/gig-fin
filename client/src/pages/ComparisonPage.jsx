import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import ComparisonCard from '../components/ComparisonCard';
import SimulationBadge from '../components/SimulationBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import { dharaApi } from '../services/dharaApi';
import {
  Calendar,
  Zap,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function ComparisonPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [compareData, setCompareData] = useState(null);

  const loadComparison = () => {
    setLoading(true);
    setError(null);
    dharaApi
      .getComparison()
      .then((data) => {
        setCompareData(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    dharaApi
      .getComparison()
      .then((data) => {
        if (!active) return;
        setCompareData(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <AppLayout maxWidth="max-w-5xl">
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Running side-by-side A/B simulation through Traditional and Dhara ledgers...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout maxWidth="max-w-5xl">
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-white">Comparison Engine Unavailable</p>
          <p className="text-xs text-slate-400">{error}</p>
          <Button variant="primary" onClick={loadComparison} icon={RefreshCw} iconPosition="left">
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  const trad = compareData?.traditional || {};
  const dhara = compareData?.dhara || {};
  const delta = compareData?.delta || {};
  const bounces = compareData?.traditional_timeline || [];

  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Traditional vs Dhara"
            subtitle="Calendar-indexed rigidity vs Cash-flow-indexed financial resilience over the same 180-day history"
            badge="Live FastAPI Comparison Engine"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Live Delta Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Traditional Bounces</span>
            <span className="text-2xl font-extrabold text-white font-mono">{trad.bounces || 0}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">NACH & RD bounce hits</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Dhara Bounces</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{dhara.bounces || 0}</span>
            <span className="text-[11px] text-emerald-300/70 block mt-0.5">Zero bounce guarantee</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">Penalties Avoided</span>
            <span className="text-2xl font-extrabold text-blue-300 font-mono">₹{Math.round(delta.fees_avoided || 0)}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Saved in bank fees</span>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">Liquid Buffer Days</span>
            <span className="text-2xl font-extrabold text-purple-300 font-mono">{dhara.buffer_days || 0}d</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">vs {trad.buffer_days || 0}d traditional</span>
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
            surge bonuses, and weekend spikes. Yet traditional banking products are <strong>calendar-indexed</strong>—demanding
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
          <ComparisonCard compact={false} />
        </div>

        {/* Live Bounce Log during Rain Drought */}
        {bounces.length > 0 && (
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <h3 className="font-bold text-base text-white text-rose-400">
              Traditional Policy Failures During Seeded Rain Drought
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bounces.map((b, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono">{b.date} · {b.kind}</span>
                  <span className="text-rose-400 font-bold font-mono">Fee: ₹{b.fee || 500}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
