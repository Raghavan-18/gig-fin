import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import LoadingState from '../components/LoadingState';
import { consentService } from '../services/consentService';
import { useApp } from '../context/useApp';
import {
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function ConsentReviewPage() {
  const navigate = useNavigate();
  const { selectedBank, setConsent, showToast } = useApp();
  const [submitting, setSubmitting] = useState(false);

  // Fallback to HDFC Bank (Simulated) if none selected
  const bank = selectedBank || {
    id: 'hdfc',
    name: 'HDFC Bank (Simulated)',
    shortName: 'HDFC (Sim)',
    logoBg: '#004c8f',
    textColor: '#ffffff',
    accountMask: 'XXXX XXXX 4521',
  };

  const handleGiveConsent = async () => {
    setSubmitting(true);
    try {
      const res = await consentService.submitConsent({
        bankId: bank.id,
        bankName: bank.name,
        accountMask: bank.accountMask || 'XXXX XXXX 4521',
      });
      setConsent(res.consent);
      showToast('Simulated consent registered successfully', 'success');
      navigate('/consent/success');
    } catch (err) {
      showToast(err.message || 'Failed to register consent', 'error');
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/consent/bank-selection');
  };

  return (
    <Layout showNavbar={false} showFooter={false} maxWidth="max-w-xl">
      <div className="min-h-[90vh] flex flex-col justify-center py-8">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        <div className="flex justify-center mb-4">
          <SimulationBadge size="sm" />
        </div>

        {submitting ? (
          <Card className="p-8 border-slate-800 shadow-2xl">
            <LoadingState
              message="Registering Simulated AA Consent..."
              subtext="Seeding synthetic bank statement and computing initial Safe-to-Save buffer"
            />
          </Card>
        ) : (
          <Card className="p-7 sm:p-8 border-slate-800 shadow-2xl space-y-6">
            <PageHeader
              title="Review & Confirm (Simulated)"
              subtitle="Confirm simulated Account Aggregator mandate over the demo dataset"
              badge="Mock Consent"
            />

            {/* Selected Bank Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-750">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: bank.logoBg || '#1e293b', color: bank.textColor || '#fff' }}
                >
                  {bank.shortName.substring(0, 4)}
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Simulated Stream
                  </span>
                  <h4 className="text-sm font-bold text-white">{bank.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Account: {bank.accountMask || 'XXXX XXXX 4521'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/consent/bank-selection')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Data Requested Section */}
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Simulated Data Scope:
              </span>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">Transaction History</span>
                  <span className="text-[11px] text-slate-500 ml-auto">Rule-based classification</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">Account Balance</span>
                  <span className="text-[11px] text-slate-500 ml-auto">For Safe-to-Save buffer</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">Account Information</span>
                  <span className="text-[11px] text-slate-500 ml-auto">Simulated holder matching</span>
                </div>
              </div>
            </div>

            {/* Purpose & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Purpose</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Cash-flow-indexed savings, credit resilience, and insurance sinking fund
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Scope</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Simulated local session (Revocable anytime from settings)
                </p>
              </div>
            </div>

            {/* Important Control Notice */}
            <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold text-xs mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Simulated Sandbox Environment</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                No real banking credentials or OTPs are required. Synthetic statements will be mounted to your session.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleCancel}
                className="order-2 sm:order-1 sm:w-1/3"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGiveConsent}
                icon={CheckCircle2}
                iconPosition="right"
                className="order-1 sm:order-2 flex-1"
              >
                Confirm Simulated Consent
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
