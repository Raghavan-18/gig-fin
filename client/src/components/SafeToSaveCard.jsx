import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import { PiggyBank, Info, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { DHARA_SAFE_TO_SAVE } from '../data/dharaData';

export default function SafeToSaveCard({
  data = DHARA_SAFE_TO_SAVE,
  className = '',
  onSaveAction,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card
        className={`p-6 sm:p-7 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 relative overflow-hidden text-left shadow-xl ${className}`}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
          {/* Top Pill & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  Safe-to-Save
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Cash-flow resilience buffer
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>How it's calculated</span>
            </button>
          </div>

          {/* Amount Display */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
                ₹{data.netSafeToSave.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                safe to allocate across 14 days
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xl">
              {data.explanation}
            </p>
          </div>

          {/* S2S Factor Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            {data.inputs.map((factor, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850">
                <span className="text-[10px] text-slate-400 block truncate">
                  {factor.label.split('(')[0]}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  {factor.isCredit ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-rose-400" />
                  )}
                  <span
                    className={`text-xs font-bold font-mono ${
                      factor.isCredit ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {factor.amount > 0 ? `+₹${factor.amount}` : `-₹${Math.abs(factor.amount)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Buffer health: 78% protected against drought days</span>
            </div>
            {onSaveAction && (
              <Button
                variant="emerald"
                size="sm"
                className="sm:ml-auto"
                onClick={onSaveAction}
              >
                Allocate Safe-to-Save (₹{data.netSafeToSave})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Modal: Calculation Breakdown */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Safe-to-Save Engine Model"
        description="Understanding cash-flow-indexed liquidity protection"
      >
        <div className="space-y-4 text-xs text-left">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300">
            <span className="text-slate-500 block mb-1">Dhara Underlying Model:</span>
            {data.formulaConcept}
          </div>

          <p className="text-slate-300 leading-relaxed">
            Unlike traditional apps that encourage workers to spend or save arbitrary percentages,
            Dhara evaluates your 14-day conservative floor (p20) before green-lighting any sweep.
          </p>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            {data.inputs.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80"
              >
                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                </div>
                <span
                  className={`font-mono font-bold text-sm ${
                    item.isCredit ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {item.amount > 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                </span>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              <span>Final Safe-to-Save Balance:</span>
              <span className="font-mono text-base">₹{data.netSafeToSave}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" fullWidth onClick={() => setModalOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
