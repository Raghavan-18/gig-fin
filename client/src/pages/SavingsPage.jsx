import { useState } from 'react';
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
import { DHARA_SMART_SWEEPS, DHARA_SAFE_TO_SAVE } from '../data/dharaData';
import {
  Plus,
  History,
  Target,
} from 'lucide-react';

export default function SavingsPage() {
  const { showToast } = useApp();
  const [sweepsData, setSweepsData] = useState(DHARA_SMART_SWEEPS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRuleType, setNewRuleType] = useState('payout_slice');
  const [customPercentage, setCustomPercentage] = useState('5');

  const [activeGoals] = useState([
    {
      id: 'g1',
      name: 'Bike Repair Fund',
      accumulated: 2500,
      target: 5000,
      progress: 50,
      category: 'Vehicle Maintenance',
    },
    {
      id: 'g2',
      name: 'Emergency Buffer',
      accumulated: 1700,
      target: 10000,
      progress: 17,
      category: 'Safety Cushion',
    },
  ]);

  const handleToggleSweepToday = () => {
    setSweepsData((prev) => {
      const nextStatus = prev.todayStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      showToast(
        nextStatus === 'ACTIVE'
          ? 'Smart Sweeps resumed for today'
          : 'Smart Sweeps paused to protect buffer',
        'info'
      );
      return {
        ...prev,
        todayStatus: nextStatus,
        pauseReason:
          nextStatus === 'PAUSED'
            ? 'Manually paused or protected due to low-income day.'
            : 'Active · Ready to skim settled payouts above safety threshold.',
      };
    });
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    showToast(`Configured simulated sweep rule (${newRuleType})`, 'success');
    setModalOpen(false);
  };

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Smart Savings & Sweeps"
            subtitle="Cash-flow-indexed automated sweeps with downside buffer protection"
            badge="Adaptive Savings Engine"
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
              ₹{sweepsData.totalAccumulated.toLocaleString('en-IN')}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Held in protected liquid reserve
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
              Safe-to-Save (14-Day Block)
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              ₹{DHARA_SAFE_TO_SAVE.netSafeToSave}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              p20 conservative headroom
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Sweep Engine Control
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                    sweepsData.todayStatus === 'PAUSED'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {sweepsData.todayStatus}
                </span>
                <span className="text-xs text-slate-400">
                  {sweepsData.todayStatus === 'PAUSED'
                    ? 'Protecting buffer'
                    : 'Skimming active'}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleToggleSweepToday}
              >
                {sweepsData.todayStatus === 'PAUSED'
                  ? 'Resume Sweeps (Simulated)'
                  : 'Pause Sweeps to Protect Buffer'}
              </Button>
            </div>
          </div>
        </div>

        {/* Safe-to-Save Breakdown Card */}
        <SafeToSaveCard />

        {/* Smart Sweeps Engine Card */}
        <SweepCard sweeps={sweepsData} />

        {/* Insurance Sinking Fund */}
        <InsuranceFundCard />

        {/* Savings Goals & Sweep History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Goals Progress */}
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Micro-Sweep Allocation Goals
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                iconPosition="left"
                onClick={() => setModalOpen(true)}
              >
                New Rule
              </Button>
            </div>

            <div className="space-y-3 pt-1">
              {activeGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">
                        {g.name}
                      </span>
                      <span className="text-slate-500 text-[11px] block">
                        {g.category}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white text-sm">
                      ₹{g.accumulated.toLocaleString('en-IN')} / ₹
                      {g.target.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-850 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{g.progress}% funded via sweeps</span>
                    <span>₹{g.target - g.accumulated} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sweep Execution History */}
          <Card className="p-6 border-slate-800 text-left space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">
                Recent Sweep Ledger (Simulated)
              </h3>
            </div>

            <p className="text-xs text-slate-400">
              Micro-sweep allocations recorded into the local simulated ledger.
            </p>

            <div className="space-y-2.5 pt-1">
              {sweepsData.recentSweeps.map((sw, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{sw.strategy}</span>
                    <span className="text-slate-500 text-[11px] block">{sw.date}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +₹{sw.amount}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                      {sw.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: New Sweep Rule */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Configure Sweep Strategy (Simulated)"
        description="Cash-flow-indexed micro-savings rule"
      >
        <form onSubmit={handleCreateRule} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Sweep Strategy Type
            </label>
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="payout_slice">Payout Slice (% of daily payout above ₹500)</option>
              <option value="surge_skim">Surge Skim (% of surge earnings above ₹1,000)</option>
              <option value="round_up">Round-up (Rounds operational spend to ₹50)</option>
            </select>
          </div>

          <Input
            label="Rate / Percentage"
            type="number"
            value={customPercentage}
            onChange={(e) => setCustomPercentage(e.target.value)}
            helper="Recommended: 5% - 10% to preserve safety floor"
          />

          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-slate-400">
            Dhara automatically pauses this sweep whenever daily income falls below the ₹600 safety threshold.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Rule (Simulated)
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
