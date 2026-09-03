import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import SimulationBadge from '../components/SimulationBadge';
import StatCard from '../components/StatCard';
import SafeToSaveCard from '../components/SafeToSaveCard';
import ForecastChart from '../components/ForecastChart';
import SweepCard from '../components/SweepCard';
import ShortfallCard from '../components/ShortfallCard';
import InsuranceFundCard from '../components/InsuranceFundCard';
import ComparisonCard from '../components/ComparisonCard';
import Card from '../components/Card';
import Button from '../components/Button';
import { useApp } from '../context/useApp';
import { dharaApi } from '../services/dharaApi';
import {
  TrendingUp,
  PiggyBank,
  Wallet,
  Sparkles,
  Receipt,
  ArrowRight,
  HelpCircle,
  Building2,
  Award,
  AlertTriangle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, selectedBank, showToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [creditData, setCreditData] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [evidenceData, setEvidenceData] = useState(null);

  const loadAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      dharaApi.getDashboard(),
      dharaApi.applyCredit(5000).catch(() => null),
      dharaApi.getTimeline(30).catch(() => ({ events: [] })),
      dharaApi.getTransactionEvidence().catch(() => null),
    ])
      .then(([dash, cred, tl, ev]) => {
        setDashboardData(dash);
        setCreditData(cred);
        setTimelineEvents(tl?.events || []);
        setEvidenceData(ev);
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
      dharaApi.getDashboard(),
      dharaApi.applyCredit(5000).catch(() => null),
      dharaApi.getTimeline(30).catch(() => ({ events: [] })),
      dharaApi.getTransactionEvidence().catch(() => null),
    ])
      .then(([dash, cred, tl, ev]) => {
        if (!active) return;
        setDashboardData(dash);
        setCreditData(cred);
        setTimelineEvents(tl?.events || []);
        setEvidenceData(ev);
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
            Connecting to Dhara FastAPI backend...
          </p>
          <p className="text-xs text-slate-500">
            Loading live double-entry ledger & quantile forecast models
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
          <h2 className="text-lg font-bold text-white">Unable to connect to Dhara server</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Button variant="primary" onClick={loadAll} icon={RefreshCw} iconPosition="left">
              Retry Connection
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const balances = dashboardData?.balances || {};
  const s2s = dashboardData?.safe_to_save || {};
  const alert = dashboardData?.alert || null;
  const sinking = dashboardData?.sinking || {};
  const totals = dashboardData?.totals || {};
  const persona = dashboardData?.persona || user || {};

  const userName = persona?.name || user?.name || 'Ravi';
  const workerRole = persona?.role || user?.workerType || 'Delivery partner';

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-8 text-left py-2">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
                Good morning, {userName.split(' ')[0]} 👋
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              <strong className="text-slate-200">{workerRole}</strong> · Live cash-flow-indexed liquidity & resilience overview
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <SimulationBadge size="sm" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{user?.simulatedBank || selectedBank?.shortName || 'HDFC (Sim)'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: FINANCIAL SNAPSHOT (LIVE BACKEND DATA)                         */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 1 · Financial Snapshot
            </h2>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              Live FastAPI Ledger Connected
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Liquid Account"
              amount={Math.round(balances.account || 0)}
              trend={{ value: `${dashboardData?.buffer_days || 0} buffer days`, isPositive: true }}
              icon={TrendingUp}
              variant="blue"
              description="Settlement balance"
            />

            <StatCard
              title="Safe-to-Save"
              amount={Math.round(s2s.amount || 0)}
              trend={{ value: 'p20 protected', isPositive: true }}
              icon={PiggyBank}
              variant="emerald"
              description={s2s.reason || '14-day safe capacity'}
            />

            <StatCard
              title="Current Buffer"
              amount={Math.round(balances.buffer || 0)}
              trend={{ value: `Burn ₹${Math.round(dashboardData?.essential_daily_burn || 0)}/d`, isPositive: true }}
              icon={Wallet}
              variant="amber"
              description="Liquid resilience cushion"
            />

            <StatCard
              title="Saved to Date"
              amount={Math.round(totals.saved_to_date || balances.total || 0)}
              trend={{ value: `${totals.sweeps_executed || 0} sweeps run`, isPositive: true }}
              icon={Sparkles}
              variant="purple"
              description={`${totals.sweeps_paused || 0} sweeps paused for safety`}
            />
          </div>

          {/* Transaction Evidence Section (Requirement 20) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/20 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Transaction Proof Evidence</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Dual Provenance
                  </span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  {evidenceData?.manual_cash_transactions || 0} Manual Cash Transactions recorded in double-entry ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {evidenceData?.receipt_verified || 0} Receipt Verified
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  {evidenceData?.self_reported || 0} Self Reported
                </span>
              </div>
              <Link to="/transactions">
                <Button variant="outline" size="sm">
                  View Statements →
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* ========================================================================= */}
        {/* SECTION 2: INCOME FORECAST (LIVE QUANTILE BACKEND)                        */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 2 · Income Forecast
            </h2>
            <Link to="/analytics" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Deep Forecast Analytics →
            </Link>
          </div>
          <ForecastChart />
        </section>

        {/* ========================================================================= */}
        {/* SECTIONS 3 & 4: SAFE-TO-SAVE & SMART SWEEPS                               */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sections 3 & 4 · Safe-to-Save & Smart Sweeps
            </h2>
            <Link to="/savings" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Manage Rules →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <SafeToSaveCard
                backendS2S={s2s}
                onSaveAction={() => {
                  showToast(`Allocated ₹${s2s.amount || 0} Safe-to-Save into liquid reserve`, 'success');
                }}
              />
            </div>

            <div className="lg:col-span-5">
              <SweepCard
                executedCount={totals.sweeps_executed}
                pausedCount={totals.sweeps_paused}
                onManageSweeps={() => navigate('/savings')}
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTIONS 5 & 7: SHORTFALL PROTECTION & INSURANCE SINKING FUND              */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sections 5 & 7 · Shortfall Protection & Insurance Sinking Fund
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShortfallCard
              backendAlert={alert}
              onSelectRemedy={(rem) => {
                showToast(`Selected remedy: ${rem.toUpperCase()}`, 'info');
              }}
            />

            <InsuranceFundCard backendSinking={sinking} />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: CREDIT RESILIENCE                                              */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 6 · Credit Resilience Assessment
            </h2>
            <Link to="/gig-score" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              View Credit Assessment →
            </Link>
          </div>

          <Card className="p-6 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-extrabold text-lg">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {creditData?.scorecard?.score
                        ? Math.round((creditData.scorecard.score / (creditData.scorecard.max_score || 100)) * 900)
                        : 742}
                    </span>
                    <span className="text-slate-400 font-mono text-sm">/ 900</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      {(creditData?.scorecard?.score || 76) >= 70 ? 'GOOD' : 'FAIR'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Financial Resilience Score · Cash-flow-indexed assessment
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Potential Eligibility:
                </span>
                <span className="text-xl font-extrabold text-white font-mono">
                  ₹5,000
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Subject to lender policy · Not Loan Approval
                </span>
              </div>
            </div>

            {/* Scorecard Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Income Consistency</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-emerald-400">Consistent</span>
                  <span className="font-mono text-sm font-bold text-white">85%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Affordability</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-blue-400">High Capacity</span>
                  <span className="font-mono text-sm font-bold text-white">82%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Repayment Capacity</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-indigo-400">Income-Linked</span>
                  <span className="font-mono text-sm font-bold text-white">90%</span>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 8: TRADITIONAL VS DHARA                                           */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 8 · Traditional vs Dhara
            </h2>
            <Link
              to="/comparison"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              <span>View full comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ComparisonCard compact={true} />

          <div className="text-right">
            <Link to="/comparison">
              <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
                View full comparison
              </Button>
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINANCIAL ASSISTANT & RECENT TRANSACTIONS PREVIEWS                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Financial Assistant Guidance Preview */}
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">
                  Dhara Financial Assistant
                </h3>
              </div>
              <Link
                to="/financial-guidance"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Ask Questions →
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              Contextual, mathematically verified answers to protect your daily cashflow.
            </p>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>How many buffer days do I have?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-5">
                  You have <strong>{dashboardData?.buffer_days || 0} days</strong> of essential buffer coverage at an essential burn rate of ₹{Math.round(dashboardData?.essential_daily_burn || 0)}/day.
                </p>
              </div>
            </div>
          </Card>

          {/* Recent Synced Transactions (Rule-based) */}
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-base text-white">
                  Recent Consented Activity
                </h3>
              </div>
              <Link
                to="/transactions"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {(timelineEvents.slice(-4).reverse() || []).map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{ev.narration}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{ev.date}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono">
                        Classification: Rule-based
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-sm ${
                      ev.kind === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {ev.kind === 'INCOME' ? `+₹${Math.round(ev.amount)}` : `-₹${Math.round(ev.amount)}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
