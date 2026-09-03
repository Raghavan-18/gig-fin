import { useState } from 'react';
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
import {
  DHARA_FINANCIAL_SNAPSHOT,
  DHARA_CREDIT_RESILIENCE,
  DHARA_TRANSACTIONS,
  DHARA_ASSISTANT_QA,
} from '../data/dharaData';
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
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, selectedBank, showToast } = useApp();

  const [snapshot] = useState(DHARA_FINANCIAL_SNAPSHOT);
  const [credit] = useState(DHARA_CREDIT_RESILIENCE);
  const [recentTx] = useState(DHARA_TRANSACTIONS.slice(0, 4));

  const userName = user?.name || 'Ramesh Patil';
  const workerTitle = user?.workerType || 'Bengaluru Delivery Rider';

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
              <strong className="text-slate-200">{workerTitle}</strong> · Cash-flow-indexed liquidity & resilience overview
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
        {/* SECTION 1: FINANCIAL SNAPSHOT                                             */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Section 1 · Financial Snapshot
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              Seeded Synthetic Feed
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              title="Income"
              amount={snapshot.monthlyIncome}
              trend={{ value: '18% weekly surge', isPositive: true }}
              icon={TrendingUp}
              variant="blue"
              description="Monthly settled gross"
            />

            <StatCard
              title="Safe-to-Save"
              amount={snapshot.safeToSave}
              trend={{ value: 'p20 protected', isPositive: true }}
              icon={PiggyBank}
              variant="emerald"
              description="14-day safe capacity"
            />

            <StatCard
              title="Current Buffer"
              amount={snapshot.currentLiquidBuffer}
              trend={{ value: 'Covers ~8 days burn', isPositive: true }}
              icon={Wallet}
              variant="amber"
              description="Protected against drought"
            />

            <StatCard
              title="Savings"
              amount={snapshot.totalSweepsAccumulated}
              trend={{ value: '+₹229 this week', isPositive: true }}
              icon={Sparkles}
              variant="purple"
              description="Held in liquid reserve"
            />
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: INCOME FORECAST                                                */}
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
        {/* SECTION 3 & 4: SAFE-TO-SAVE & SMART SWEEPS                                */}
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
                onSaveAction={() => {
                  showToast('Allocated ₹420 Safe-to-Save into liquid reserve', 'success');
                }}
              />
            </div>

            <div className="lg:col-span-5">
              <SweepCard
                onManageSweeps={() => navigate('/savings')}
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5 & 7: SHORTFALL PROTECTION & INSURANCE SINKING FUND               */}
        {/* ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sections 5 & 7 · Shortfall Protection & Insurance Sinking Fund
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShortfallCard
              onSelectRemedy={(rem) => {
                showToast(`Selected remedy: ${rem.toUpperCase()}`, 'info');
              }}
            />

            <InsuranceFundCard />
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
                      {credit.score}
                    </span>
                    <span className="text-slate-400 font-mono text-sm">
                      / {credit.maxScore}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
                      {credit.status}
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
                  ₹{credit.potentialEligibilityAmount.toLocaleString('en-IN')}
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
              {DHARA_ASSISTANT_QA.slice(0, 2).map((qa) => (
                <div
                  key={qa.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>{qa.question}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-5">
                    {qa.answer}
                  </p>
                </div>
              ))}
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
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-white">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.date}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono">
                        Classification: Rule-based
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-sm ${
                      tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
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
