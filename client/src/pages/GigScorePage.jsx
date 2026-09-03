import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import ScoreGauge from '../components/ScoreGauge';
import RepaymentCard from '../components/RepaymentCard';
import { DHARA_CREDIT_RESILIENCE } from '../data/dharaData';
import {
  Award,
  Building2,
  Info,
} from 'lucide-react';

export default function GigScorePage() {
  const data = DHARA_CREDIT_RESILIENCE;

  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Credit Resilience & Dhara Assessment"
            subtitle="Cash-flow-indexed creditworthiness scorecard derived from consented statement streams"
            badge="Credit Policy Engine"
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
                Demo Scorecard
              </span>
            </div>

            <ScoreGauge
              score={data.score}
              maxScore={data.maxScore}
              status={data.status}
            />

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">
                Tier 1 Working-Capital Profile
              </p>
              <p className="text-[11px] text-slate-500">
                Simulated credit/scorecard.py model
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
              {data.factors.map((f, idx) => (
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
          <RepaymentCard repayment={data.incomeLinkedRepayment} />
        </div>

        {/* Working-Capital Potential Eligibility (NO LOAN APPROVAL CLAIMS) */}
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

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Based on your steady payout frequency and Safe-to-Save buffer discipline,
            your synthetic financial profile qualifies for income-linked micro-credit assessment.
          </p>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 block font-medium">
              Potential working-capital eligibility:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                ₹{data.potentialEligibilityAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                (Potential Eligibility · Not Loan Approval)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Designed for motorcycle tyre replacements, monsoon gear, or fuel liquidity buffers.
            </p>
          </div>

          {/* Mandatory Regulatory Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p>{data.disclaimer}</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
