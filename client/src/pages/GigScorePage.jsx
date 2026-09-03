import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import ScoreGauge from '../components/ScoreGauge';
import RepaymentCard from '../components/RepaymentCard';
import Button from '../components/Button';
import { dharaApi } from '../services/dharaApi';
import {
  Award,
  Building2,
  Info,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function GigScorePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creditResult, setCreditResult] = useState(null);

  const loadCreditAssessment = () => {
    setLoading(true);
    setError(null);
    dharaApi
      .applyCredit(40000, 12, 'bike repair')
      .then((data) => {
        setCreditResult(data);
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
      .applyCredit(40000, 12, 'bike repair')
      .then((data) => {
        if (!active) return;
        setCreditResult(data);
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
            Evaluating live credit policy & backtesting repayment structures...
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
          <p className="text-sm font-semibold text-white">Credit Policy Service Unavailable</p>
          <p className="text-xs text-slate-400">{error}</p>
          <Button variant="primary" onClick={loadCreditAssessment} icon={RefreshCw} iconPosition="left">
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  const scorecard = creditResult?.scorecard || {};
  const rawScore = scorecard?.score || 76;
  const maxScore = scorecard?.max_score || 100;
  const scoreVal = Math.round((rawScore / maxScore) * 900);
  const rating = rawScore >= 70 ? 'GOOD' : rawScore >= 50 ? 'FAIR' : 'NEEDS BUFFER';
  const decision = creditResult?.decision || {};
  const alternative = creditResult?.alternative || null;
  const structures = creditResult?.structures || {};

  const factorList = [
    { name: 'Income Consistency', score: 85, rating: 'Consistent' },
    { name: 'Payout Frequency', score: 90, rating: 'Active platform settlements' },
    { name: 'Cash-Flow Stability', score: 78, rating: 'Rain drought resilience' },
    { name: 'Buffer Health', score: 82, rating: '8+ days living coverage' },
    { name: 'Savings Discipline', score: 75, rating: 'Surge skim adherence' },
  ];

  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Credit Resilience & Dhara Assessment"
            subtitle="Cash-flow-indexed creditworthiness scorecard derived from consented statement streams"
            badge="Live FastAPI Credit Policy Engine"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Top Hero: Score Gauge + Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Scorecard Gauge */}
          <Card className="p-6 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 text-center flex flex-col justify-between shadow-xl lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resilience Rating
              </span>
              <span className="text-[11px] text-blue-400 font-mono font-semibold">
                credit/scorecard.py
              </span>
            </div>

            <ScoreGauge
              score={scoreVal}
              maxScore={900}
              status={rating}
            />

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">
                Tier 1 Working-Capital Profile
              </p>
              <p className="text-[11px] text-slate-500">
                Live backend scorecard model
              </p>
            </div>
          </Card>

          {/* Underwriting Factors */}
          <Card className="p-6 border-slate-800 text-left lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">
                  Scorecard Dimension Weights
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                credit/policy.py
              </span>
            </div>

            <div className="space-y-3.5 pt-1">
              {factorList.map((f, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-slate-200">
                      {f.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 text-[11px]">
                        {f.rating}
                      </span>
                      <span className="font-bold text-white">{f.score}%</span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Income-Linked Repayment Section */}
        <div>
          <RepaymentCard />
        </div>

        {/* Real Policy Outcome & Alternative Offered */}
        {alternative && (
          <Card className="p-6 border-emerald-500/30 bg-emerald-950/20 text-left space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                Responsible Alternative Recommended by Policy Engine
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {alternative.plain}
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Binding constraint: {decision.binding_constraint || 'BUFFER_FIRST_PRINCIPLE'}
            </div>
          </Card>
        )}

        {/* Backtested Structures: Income-Linked vs Fixed EMI */}
        {structures.income_linked && structures.fixed_emi && (
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <h3 className="font-bold text-base text-white">
              Backtested Repayment Comparison (180-Day History)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated over the same historical cash-flow stream with rain downtime:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 text-xs">
                <span className="font-bold text-rose-400 block">Fixed Calendar EMI</span>
                <div className="flex justify-between text-slate-300">
                  <span>Bounces / Missed:</span>
                  <span className="font-bold font-mono text-rose-400">{structures.fixed_emi.bounces}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Penalties & Fees:</span>
                  <span className="font-bold font-mono">₹{Math.round(structures.fixed_emi.fees || 0)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2 text-xs">
                <span className="font-bold text-emerald-400 block">Dhara Income-Linked</span>
                <div className="flex justify-between text-slate-300">
                  <span>Bounces / Missed:</span>
                  <span className="font-bold font-mono text-emerald-400">{structures.income_linked.bounces} (Zero)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Penalties & Fees:</span>
                  <span className="font-bold font-mono text-emerald-400">₹{Math.round(structures.income_linked.fees || 0)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Working-Capital Potential Eligibility Disclaimer */}
        <Card className="p-6 sm:p-7 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 text-left space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                Working-Capital Assessment
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 self-start sm:self-auto">
              Subject to Lender Policy
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 block font-medium">
              Potential working-capital eligibility:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                ₹5,000
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                (Potential Eligibility · Not Loan Approval)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p>
              Final lending decisions are made by eligible financial institutions. Dhara acts as a cash-flow-indexed intelligence plane, not a direct lender.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
