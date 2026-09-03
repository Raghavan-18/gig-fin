import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ForecastChart from '../components/ForecastChart';
import SimulationBadge from '../components/SimulationBadge';
import ExpenseBreakdownChart from '../components/ExpenseBreakdownChart';
import Card from '../components/Card';
import Button from '../components/Button';
import { dharaApi } from '../services/dharaApi';
import {
  TrendingUp,
  Activity,
  Zap,
  Sparkles,
  Layers,
  Info,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [classifyData, setClassifyData] = useState(null);

  const categories = [
    { name: 'Housing (Rent & EMI)', amount: 5000, percentage: 32, color: '#3b82f6' },
    { name: 'Food & Meals', amount: 4320, percentage: 28, color: '#10b981' },
    { name: 'Motorcycle Petrol', amount: 3550, percentage: 23, color: '#f59e0b' },
    { name: 'Utility & Bills', amount: 1650, percentage: 11, color: '#8b5cf6' },
    { name: 'Maintenance / Other', amount: 900, percentage: 6, color: '#64748b' },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      dharaApi.getForecast(30),
      dharaApi.getClassify(100),
    ])
      .then(([fc, cl]) => {
        setForecastData(fc);
        setClassifyData(cl);
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
    Promise.all([
      dharaApi.getForecast(30),
      dharaApi.getClassify(100),
    ])
      .then(([fc, cl]) => {
        if (!active) return;
        setForecastData(fc);
        setClassifyData(cl);
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
      <AppLayout maxWidth="max-w-7xl">
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Running GradientBoosting quantile regression models...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout maxWidth="max-w-7xl">
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Forecast Service Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Button variant="primary" onClick={loadData} icon={RefreshCw} iconPosition="left">
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const gross = classifyData?.gross_inflow || 24850;
  const assessed = classifyData?.assessed_income || 23600;
  const excluded = classifyData?.excluded_total || 1250;
  const cal = forecastData?.calibration || {};

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Income & Cash Flow Forecast"
            subtitle="GradientBoosting quantile forecasting (p10, p20, p50, p90) & cross-conformal calibration"
            badge="Dhara ML / Quantile Engine"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* 4 Statistics from live backend */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Gross Inflow"
            amount={Math.round(gross)}
            trend={{ value: 'Seeded 180-day stream', isPositive: true }}
            icon={TrendingUp}
            variant="blue"
            description="Total platform inflows"
          />

          <StatCard
            title="Assessed Income"
            amount={Math.round(assessed)}
            trend={{ value: 'Underwriting baseline', isPositive: true }}
            icon={Calendar}
            variant="emerald"
            description="Excludes self-transfers"
          />

          <StatCard
            title="Excluded Transfers"
            amount={Math.round(excluded)}
            trend={{ value: 'Anti-gaming rule', isPositive: false }}
            icon={Activity}
            variant="amber"
            description="Self-transfers removed"
          />

          <StatCard
            title="Model Calibration"
            value={`${Math.round((cal.coverage_p10_p90 || 0.828) * 100)}%`}
            trend={{ value: 'Target: 75%-85%', isPositive: true }}
            icon={Zap}
            variant="purple"
            description="Held-out empirical coverage"
          />
        </div>

        {/* Forecast Visualization (p10, p20, p50, p90) */}
        <div>
          <ForecastChart />
        </div>

        {/* Quantile Model Explanation & Rule-Based Inflow Classification */}
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
                  <span className="text-slate-300">Used as denominator in Safe-to-Save equation.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-emerald-400">p50 Median: </span>
                  <span className="text-slate-300">Expected baseline income for operational planning.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850">
                  <span className="font-bold text-purple-400">p90 Peak: </span>
                  <span className="text-slate-300">Triggers Surge Skim sweeps into liquid reserve.</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-300">
              Live FastAPI backend: GradientBoostingRegressor with conformal width ±₹{Math.round(cal.conformal_width_rupees || 322)}.
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
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Rule-based Classifier (Anti-Gaming Active)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Assessed Payouts vs Self-Transfers
                </span>
                <span className="text-slate-400 font-mono">
                  ₹{Math.round(assessed).toLocaleString('en-IN')} / ₹{Math.round(gross).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-l-full"
                  style={{ width: `${Math.round((assessed / (gross || 1)) * 100)}%` }}
                />
                <div
                  className="h-full bg-amber-500 rounded-r-full"
                  style={{ width: `${Math.round((excluded / (gross || 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Assessed Gig Income ({Math.round((assessed / (gross || 1)) * 100)}%)</span>
                <span>Self-Transfers Excluded ({Math.round((excluded / (gross || 1)) * 100)}%)</span>
              </div>
            </div>

            {/* Pattern Intelligence Insight */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/20 flex items-start gap-3 mt-4">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">
                  Anti-Gaming Classification Policy
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Self-transfers are explicitly filtered out from assessed income. To traditional balance-based underwriters, personal transfers appear as fresh income; Dhara's rule classifier detects and drops them to prevent synthetic inflation.
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
