import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import ComparisonCard from '../components/ComparisonCard';
import {
  ArrowRight,
  TrendingUp,
  PiggyBank,
  GitCompare,
  Umbrella,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Activity,
} from 'lucide-react';

export default function LandingPage() {
  const capabilities = [
    {
      title: 'Income Forecast',
      desc: 'Quantile forecasting (p10, p20, p50, p90) modeling statistical distributions across volatile gig days.',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-600/10 border-blue-500/20',
    },
    {
      title: 'Safe-to-Save',
      desc: 'Real-time calculation of what you can safely save while preserving your living & fuel buffer.',
      icon: PiggyBank,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10 border-emerald-500/20',
    },
    {
      title: 'Smart Sweeps',
      desc: 'Payout Slice, Surge Skim, and Round-ups that automatically pause on slow days to safeguard liquidity.',
      icon: Sparkles,
      color: 'text-purple-400',
      bg: 'bg-purple-600/10 border-purple-500/20',
    },
    {
      title: 'Shortfall Protection',
      desc: 'Forward-looking deficit warning before obligations hit, offering Buffer, Reduce, and Borrow remedies.',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-600/10 border-rose-500/20',
    },
    {
      title: 'Income-Linked Repayment',
      desc: 'Repayments dynamically scale with daily settled payouts: zero-income days owe ₹0 with zero bounce fees.',
      icon: RefreshCw,
      color: 'text-indigo-400',
      bg: 'bg-indigo-600/10 border-indigo-500/20',
    },
    {
      title: 'Insurance Sinking Fund',
      desc: 'Daily micro-accruals of ₹10 toward annual health & accident premiums to prevent policy lapses.',
      icon: Umbrella,
      color: 'text-teal-400',
      bg: 'bg-teal-600/10 border-teal-500/20',
    },
    {
      title: 'Credit Resilience',
      desc: 'Alternative cash-flow scorecard based on payout frequency, buffer health, and repayment capacity.',
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-600/10 border-amber-500/20',
    },
    {
      title: 'Financial Assistant',
      desc: 'Contextual, mathematically verified answers to questions like "Can I save today?" or "Why was my sweep paused?".',
      icon: HelpCircle,
      color: 'text-cyan-400',
      bg: 'bg-cyan-600/10 border-cyan-500/20',
    },
  ];

  return (
    <Layout showNavbar={true} showFooter={true} maxWidth="max-w-7xl">
      {/* Hero Section */}
      <section className="relative pt-6 pb-14 md:pt-14 md:pb-20 text-center">
        {/* Simulation Badge */}
        <div className="flex justify-center mb-6">
          <SimulationBadge size="md" />
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto font-display">
          DHARA
          <span className="block text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent mt-2">
            Cash-Flow-Indexed Financial Resilience for Gig & Informal Workers
          </span>
        </h1>

        {/* Core Value Statement */}
        <div className="mt-5 inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs sm:text-sm font-semibold">
          "Your financial plan should bend with your income."
        </div>

        {/* The Problem & Dhara's Solution */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-left">
          <Card className="p-5 border-rose-500/20 bg-rose-950/10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
              The Problem
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Gig workers experience highly volatile daily income, making fixed-date savings, rigid EMIs, and traditional financial planning painful and prone to costly bounce fees.
            </p>
          </Card>

          <Card className="p-5 border-emerald-500/20 bg-emerald-950/10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Dhara's Architecture
            </span>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dhara adapts savings, credit, insurance, and financial guidance to the worker's actual daily cash flow, ring-fencing safety floors before sweeping a single rupee.
            </p>
          </Card>
        </div>

        {/* Primary CTA: "Explore Dhara" */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login">
            <Button size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto px-10 py-4 text-base font-bold shadow-xl shadow-blue-600/30">
              Explore Dhara
            </Button>
          </Link>
          <Link to="/comparison">
            <Button variant="outline" size="lg" icon={GitCompare} iconPosition="left" className="w-full sm:w-auto px-6 py-4">
              Traditional vs Dhara
            </Button>
          </Link>
        </div>

        {/* Supported Platforms Banner */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-3">
            Designed for delivery partners & drivers across India
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 font-semibold text-xs sm:text-sm">
            <span>🟠 Swiggy</span>
            <span>🔴 Zomato</span>
            <span>⚫ Uber</span>
            <span>🟢 Ola</span>
            <span>🟣 Porter</span>
          </div>
        </div>
      </section>

      {/* Major Capabilities Grid */}
      <section className="py-12 border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Engineered For Cash-Flow Volatility
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Major Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <Card key={idx} className="p-5 border-slate-800 hover:border-blue-500/40 transition-all space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${cap.bg} ${cap.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{cap.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{cap.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Traditional vs Dhara Interactive Comparison */}
      <section className="py-12 border-t border-slate-800/60">
        <ComparisonCard compact={true} />
        <div className="text-center mt-6">
          <Link to="/comparison">
            <Button variant="primary" size="md">
              View Detailed Traditional vs Dhara Breakdown →
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
