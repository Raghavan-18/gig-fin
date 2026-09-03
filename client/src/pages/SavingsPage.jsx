import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import SafeToSaveCard from '../components/SafeToSaveCard';
import SweepCard from '../components/SweepCard';
import InsuranceFundCard from '../components/InsuranceFundCard';
import SimulationBadge from '../components/SimulationBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useApp } from '../context/useApp';
import { dharaApi } from '../services/dharaApi';
import {
  History,
  AlertTriangle,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export default function SavingsPage() {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawBucket, setWithdrawBucket] = useState('buffer');
  const [withdrawing, setWithdrawing] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      dharaApi.getDashboard(),
      dharaApi.getTimeline(30),
    ])
      .then(([dash, tl]) => {
        setDashboardData(dash);
        setTimelineData(tl);
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
      dharaApi.getTimeline(30),
    ])
      .then(([dash, tl]) => {
        if (!active) return;
        setDashboardData(dash);
        setTimelineData(tl);
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

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawing(true);
    try {
      const res = await dharaApi.withdraw(Number(withdrawAmount), withdrawBucket);
      showToast(`Withdrawn ₹${withdrawAmount} from ${withdrawBucket} (${res.penalty === 0 ? 'Zero penalty' : ''})`, 'success');
      setWithdrawModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout maxWidth="max-w-7xl">
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Loading live Safe-to-Save & sweep allocations...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout maxWidth="max-w-7xl">
        <div className="py-16 text-center max-w-md mx-auto space-y-4">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-white">Savings Service Unavailable</p>
          <p className="text-xs text-slate-400">{error}</p>
          <Button variant="primary" onClick={loadData} icon={RefreshCw} iconPosition="left">
            Retry
          </Button>
        </div>
      </AppLayout>
    );
  }

  const s2s = dashboardData?.safe_to_save || {};
  const balances = dashboardData?.balances || {};
  const sinking = dashboardData?.sinking || {};
  const totals = dashboardData?.totals || {};
  const dailyRecords = timelineData?.daily || [];

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Smart Savings & Sweeps"
            subtitle="Cash-flow-indexed automated sweeps with downside buffer protection"
            badge="Live FastAPI Sweep Engine"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
              Total Sweeps Accumulated
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              ₹{Math.round(totals.saved_to_date || balances.total || 0).toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {totals.sweeps_executed || 0} executed · {totals.sweeps_paused || 0} paused for protection
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Safe-to-Save (14-Day Block)
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              ₹{Math.round(s2s.amount || 0)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {s2s.reason || 'p20 conservative headroom'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Simulated Money Movement
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Zero Penalty Out
                </span>
                <span className="text-xs text-slate-400">
                  Buffer holds ₹{Math.round(balances.buffer || 0)}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setWithdrawModalOpen(true)}
                icon={Wallet}
                iconPosition="left"
              >
                Withdraw Funds (Simulated)
              </Button>
            </div>
          </div>
        </div>

        {/* Safe-to-Save Breakdown Card */}
        <SafeToSaveCard backendS2S={s2s} />

        {/* Smart Sweeps Engine Card */}
        <SweepCard
          executedCount={totals.sweeps_executed}
          pausedCount={totals.sweeps_paused}
        />

        {/* Insurance Sinking Fund */}
        <InsuranceFundCard backendSinking={sinking} />

        {/* Recent Daily Sweep Records from Ledger */}
        <Card className="p-6 border-slate-800 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">
                Live Replay: 30-Day Sweep History
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              core/engine.py
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Notice that during rain downtime (drought), sweeps automatically pause with reasons like <code className="text-amber-400 font-mono">DROUGHT</code> or <code className="text-blue-400 font-mono">INSUFFICIENT_BUFFER</code> to prevent draining your living cushion.
          </p>

          <div className="space-y-2.5 pt-1 max-h-96 overflow-y-auto pr-1">
            {dailyRecords.slice(-15).reverse().map((d, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Day {d.idx}</span>
                    {d.is_drought && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Rain Drought
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[11px] block">
                    Settlement: ₹{Math.round(d.settlement || 0)} · Buffer: ₹{Math.round(d.buffer || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {d.paused ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Paused ({d.reason})
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +₹{Math.round(d.sweep || 0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal: Withdraw (Simulated Money Movement) */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Simulated Money Movement (Instant Out)"
        description="Withdraw liquid savings instantly with no penalty and no interrogation"
      >
        <form onSubmit={handleWithdraw} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Source Bucket
            </label>
            <select
              value={withdrawBucket}
              onChange={(e) => setWithdrawBucket(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="buffer">Liquid Buffer (Balance: ₹{Math.round(balances.buffer || 0)})</option>
              <option value="insurance_fund">Insurance Sinking Fund (Balance: ₹{Math.round(balances.insurance_fund || 0)})</option>
            </select>
          </div>

          <Input
            label="Amount (₹)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            helper="Trust contract: instant out with zero penalty"
          />

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-400">
            Calls <code className="text-blue-300 font-mono">POST /api/withdraw</code> on FastAPI double-entry ledger. Zero penalty and zero interrogation questions.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={withdrawing}>
              Confirm Withdrawal
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
