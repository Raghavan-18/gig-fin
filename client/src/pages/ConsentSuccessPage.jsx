import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import {
  CheckCircle2,
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function ConsentSuccessPage() {
  const navigate = useNavigate();
  const { selectedBank, consent } = useApp();

  const bankName = consent?.bankName || selectedBank?.name || 'HDFC Bank (Simulated)';
  const accountMask = consent?.accountMask || selectedBank?.accountMask || 'XXXX XXXX 4521';
  const consentStatus = consent?.status || 'ACTIVE';

  const pipeline = [
    { label: 'Connect Financial Data', done: true },
    { label: 'Consent Granted', done: true },
    { label: 'Simulated AA Connection', done: true },
    { label: 'Synthetic Statements Imported', done: true },
    { label: 'Dhara Financial Intelligence', done: true },
  ];

  return (
    <Layout showNavbar={false} showFooter={false} maxWidth="max-w-lg">
      <div className="min-h-[90vh] flex flex-col justify-center py-8">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        <div className="flex justify-center mb-3">
          <SimulationBadge size="sm" />
        </div>

        <Card className="p-7 sm:p-8 border-slate-800 shadow-2xl text-center space-y-5 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Success Checkmark Icon */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[2px] shadow-xl shadow-emerald-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Simulated Financial Data Imported
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Dhara has populated your session with 90-day synthetic statements and calibrated your initial Safe-to-Save buffer.
            </p>
          </div>

          {/* Visual User Journey Pipeline */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Simulation Pipeline Status:
            </span>
            <div className="space-y-1.5 text-xs">
              {pipeline.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Data Stream:</span>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-white">{bankName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Account:</span>
              <span className="font-mono font-semibold text-slate-200">
                {accountMask}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Consent State:</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SIMULATED {consentStatus}
              </span>
            </div>
          </div>

          {/* Go to Dashboard CTA */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/dashboard')}
              icon={ArrowRight}
              iconPosition="right"
              className="font-bold text-sm"
            >
              Enter Dhara Dashboard →
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
