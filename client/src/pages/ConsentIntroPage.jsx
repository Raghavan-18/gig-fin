import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import ConsentCard from '../components/ConsentCard';
import SimulationBadge from '../components/SimulationBadge';
import {
  Lock,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  RefreshCw,
  Database,
} from 'lucide-react';

export default function ConsentIntroPage() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/consent/bank-selection');
  };

  return (
    <Layout showNavbar={false} showFooter={false} maxWidth="max-w-2xl">
      <div className="min-h-[90vh] flex flex-col justify-center py-8">
        <div className="flex justify-center mb-5">
          <Logo size="lg" />
        </div>

        <Card className="p-7 sm:p-8 border-slate-800 shadow-2xl space-y-7 text-left">
          {/* Header */}
          <div className="text-center space-y-2.5">
            <SimulationBadge size="md" />

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Connect Financial Data (Simulated AA)
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed pt-1">
              Dhara uses simulated Account Aggregator consent to import synthetic banking and
              gig-payout statements into the local session.
            </p>
          </div>

          {/* Simulation Notice Banner */}
          <div className="p-3.5 rounded-xl bg-blue-950/25 border border-blue-500/25 flex items-start gap-2.5 text-xs text-blue-200">
            <Database className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mock Consent Flow (Seeded Synthetic Dataset)</p>
              <p className="text-slate-400 mt-0.5">
                No real bank or UPI credentials required. This step simulates the RBI Account Aggregator protocol.
              </p>
            </div>
          </div>

          {/* Core Info Blocks: Why, What, How */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Why simulated AA
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To capture volatile daily earnings and model cash-flow resilience without asking for manual uploads.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                How data is used
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Feeds the Safe-to-Save engine, Smart Sweeps, Quantile Income Forecasting, and Insurance Sinking Fund.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Privacy Guarantees
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Synthetic tokens only. Simulated consent can be revoked or paused instantly from settings.
              </p>
            </div>
          </div>

          {/* Data Requested Component */}
          <ConsentCard
            items={[
              {
                title: 'Transaction history (Synthetic)',
                subtitle: 'Past 90 days to analyze earnings volatility, fuel expenses, and platform incentives',
              },
              {
                title: 'Account balance (Simulated)',
                subtitle: 'Real-time balance to ensure calculated Safe-to-Save leaves sufficient cash for obligations',
              },
              {
                title: 'Account information',
                subtitle: 'Simulated account holder name matching your chosen demo persona',
              },
            ]}
          />

          {/* Consent Guarantee Strip */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Session Duration: <strong className="text-slate-200">Demo Session</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Revocable anytime</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleContinue}
              icon={ArrowRight}
              iconPosition="right"
            >
              Select Simulated Bank →
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
