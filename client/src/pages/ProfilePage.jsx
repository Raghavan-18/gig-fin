import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import {
  User,
  Briefcase,
  Building2,
  Settings,
  ExternalLink,
  MapPin,
  Layers,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, selectedBank, consent } = useApp();

  const name = user?.name || 'Ramesh Patil';
  const workerType = user?.workerType || 'Bengaluru Delivery Rider';
  const platform = user?.platform || 'Swiggy & Zomato';
  const city = user?.city || 'Bengaluru, Karnataka';

  return (
    <AppLayout maxWidth="max-w-4xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Demo Persona Profile"
            subtitle="Synthetic gig worker identity used for Dhara prototype evaluation"
            badge="Demo Profile"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Profile Card */}
        <Card className="p-6 sm:p-8 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-[2px] shadow-lg shadow-blue-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-blue-400">
                  {name.charAt(0)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {name}
                  </h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    Synthetic Persona
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {workerType} · {platform}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Switch Persona
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="secondary" size="sm" icon={Settings} iconPosition="left">
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Simplified Core Fields (No unnecessary KYC) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Persona Name</span>
              </span>
              <p className="text-sm font-semibold text-white">{name}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Occupational Category</span>
              </span>
              <p className="text-sm font-semibold text-white">{workerType}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Operating City</span>
              </span>
              <p className="text-sm font-semibold text-white">{city}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Consented Platforms</span>
              </span>
              <p className="text-sm font-semibold text-white">{platform}</p>
            </div>
          </div>
        </Card>

        {/* Connected Bank & Consent Link */}
        <Card className="p-6 border-slate-800 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">
                Simulated Account Aggregator Linkage
              </h3>
            </div>
            <Link
              to="/consent-management"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Simulated Consent</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                {selectedBank?.shortName?.substring(0, 4) || 'HDFC'}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {selectedBank?.name || 'HDFC Bank (Simulated)'}
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Account: {consent?.accountMask || 'XXXX XXXX 4521'}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase self-start sm:self-auto ${
                consent?.status === 'REVOKED'
                  ? 'bg-rose-500/20 text-rose-300'
                  : consent?.status === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              Simulated Consent {consent?.status || 'ACTIVE'}
            </span>
          </div>
        </Card>

        {/* Data Provenance & Trust Hierarchy Section (Requirement 21) */}
        <Card className="p-6 border-slate-800 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">
                Data Provenance & Source Tiers
              </h3>
              <p className="text-xs text-slate-400">
                How transaction evidence and financial data sources are verified in Dhara
              </p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View Transactions →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* 1. BANK / UPI */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  BANK / UPI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  ✓ Simulated AA
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                Simulated Account Aggregator
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically imported financial transactions directly from institutional banking consent.
              </p>
            </div>

            {/* 2. MANUAL CASH */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  MANUAL CASH
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Dual Provenance
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                Cash Transactions Entered by User
              </h4>
              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-emerald-400 font-bold block">✓ Receipt Verified</span>
                  <span className="text-slate-400">Supporting receipt evidence processed by Dhara.</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-amber-400 font-bold block">⚠ Self Reported</span>
                  <span className="text-slate-400">No receipt evidence attached. Entered manually.</span>
                </div>
              </div>
            </div>

            {/* 3. SYNTHETIC DATA */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SYNTHETIC DATA
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  DEMO · Synthetic
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                Hackathon Evaluation Data
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generated 180-day baseline data used for drought stress-testing and comparison demonstrations.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

