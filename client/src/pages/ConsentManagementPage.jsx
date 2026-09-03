import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SimulationBadge from '../components/SimulationBadge';
import { useApp } from '../context/useApp';
import { consentService } from '../services/consentService';
import {
  ShieldCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Pause,
  Play,
  Trash2,
  Info,
  CheckCircle2,
  Database,
} from 'lucide-react';

export default function ConsentManagementPage() {
  const { consent, setConsent, selectedBank, showToast } = useApp();
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const bankName = consent?.bankName || selectedBank?.name || 'HDFC Bank (Simulated)';
  const accountMask = consent?.accountMask || 'XXXX XXXX 4521';
  const consentStatus = consent?.status || 'ACTIVE';

  const isPaused = consentStatus === 'PAUSED';
  const isRevoked = consentStatus === 'REVOKED';

  const handleTogglePause = async () => {
    if (isRevoked) {
      showToast('Simulated consent is revoked and cannot be paused', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await consentService.pauseConsent();
      setConsent(res.consent);
      showToast(res.message, 'info');
    } catch {
      showToast('Failed to update consent status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async () => {
    setLoading(true);
    try {
      const res = await consentService.revokeConsent();
      setConsent(res.consent);
      setRevokeModalOpen(false);
      showToast('Simulated Account Aggregator access revoked', 'success');
    } catch {
      showToast('Failed to revoke consent', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout maxWidth="max-w-4xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Simulated Consent Management"
            subtitle="Manage your demo financial data connection and simulated Account Aggregator tokens"
            badge="Simulated AA Gateway"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Status Notice Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isRevoked
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              : isPaused
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                Demo Connection State
              </span>
              <span className="text-base font-extrabold font-mono">
                SIMULATED {consentStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            {isRevoked
              ? 'Synthetic data updates stopped. Historical dashboard remains in read-only mode.'
              : isPaused
              ? 'Simulated statement sync temporarily paused.'
              : 'Active synthetic stream feeding Safe-to-Save and Smart Sweeps engines.'}
          </p>
        </div>

        {/* Connected Bank & Parameters Card */}
        <Card className="p-6 sm:p-8 border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Simulated Bank Connection
                </span>
                <h3 className="text-lg font-bold text-white">{bankName}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Account: {accountMask}
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase self-start sm:self-auto ${
                isRevoked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : isPaused
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              Status: {consentStatus}
            </span>
          </div>

          {/* Data Access Scopes */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Synthetic Data Scope:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Transaction History</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Account Balance</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Account Information</span>
              </div>
            </div>
          </div>

          {/* Dates & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Data Source:</span>
              </span>
              <p className="font-semibold text-white">Synthetic Seeded Dataset</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Endpoint:</span>
              </span>
              <p className="font-semibold text-white font-mono">POST /api/session (Simulated)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDetailsModalOpen(true)}
              icon={Info}
              iconPosition="left"
            >
              View Mandate Details
            </Button>

            {!isRevoked && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleTogglePause}
                loading={loading}
                icon={isPaused ? Play : Pause}
                iconPosition="left"
              >
                {isPaused ? 'Resume Sync' : 'Pause Sync'}
              </Button>
            )}

            {!isRevoked && (
              <Button
                variant="danger"
                size="md"
                onClick={() => setRevokeModalOpen(true)}
                icon={Trash2}
                iconPosition="left"
                className="sm:ml-auto"
              >
                Revoke Simulated Consent
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Modal: View Consent Details */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Simulated Consent Artifact"
        description="Demo Account Aggregator mandate metadata"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 font-mono space-y-2 text-slate-300 border border-slate-800">
            <div>
              <span className="text-slate-500">Consent Handle: </span>
              <span className="text-blue-400">
                {consent?.consentId || 'AA_CNS_SIMULATED_9281'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">FIU (Financial Info User): </span>
              <span className="text-white">Dhara Financial Resilience Engine</span>
            </div>
            <div>
              <span className="text-slate-500">FIP (Financial Info Provider): </span>
              <span className="text-white">{bankName}</span>
            </div>
            <div>
              <span className="text-slate-500">Purpose Code: </span>
              <span className="text-white">101 - Cash-flow-indexed Financial Resilience</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setDetailsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Revoke Confirmation */}
      <Modal
        isOpen={revokeModalOpen}
        onClose={() => setRevokeModalOpen(false)}
        title="Revoke Simulated AA Access?"
        description="This will terminate synthetic statement ingestion."
      >
        <div className="space-y-4 text-left">
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 space-y-1">
              <p className="font-semibold">
                Are you sure you want to disconnect this simulated stream?
              </p>
              <p className="text-slate-400">
                Disconnecting simulated access pauses automated Safe-to-Save updates and smart sweeps.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRevokeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={loading}
              onClick={handleRevokeConsent}
            >
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
