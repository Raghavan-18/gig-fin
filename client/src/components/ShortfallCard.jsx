import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import { AlertTriangle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DHARA_SHORTFALL } from '../data/dharaData';

export default function ShortfallCard({
  data = DHARA_SHORTFALL,
  className = '',
  onSelectRemedy,
}) {
  const [selectedRemedy, setSelectedRemedy] = useState(data.recommendedResponse.toLowerCase());
  const [resolved, setResolved] = useState(false);

  return (
    <Card
      className={`p-6 border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25 text-left space-y-4 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Shortfall Protection
            </h3>
            <p className="text-xs text-slate-400">
              Forward-looking deficit forecasting before obligations hit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Deficit in {data.daysUntilShortfall} Days
          </span>
        </div>
      </div>

      {/* Alert Details */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block">
              Forecasted Event
            </span>
            <p className="text-sm font-bold text-white">{data.triggerEvent}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[11px] uppercase font-bold text-rose-400 block">
              Expected Deficit
            </span>
            <span className="text-xl font-extrabold text-rose-400 font-mono">
              ₹{data.deficitAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 pt-1 leading-relaxed">
          {data.summaryText}
        </p>
      </div>

      {/* 3 Response Remedies: Buffer, Reduce, Borrow */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Available Response Options:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {data.remedyOptions.map((opt) => {
            const isSelected = selectedRemedy === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedRemedy(opt.id)}
                className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{opt.name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        opt.id === 'buffer'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : opt.id === 'reduce'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-850 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Cost</span>
                  <span className="font-semibold text-slate-300 font-mono">
                    {opt.costText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Execution */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>
            Liquid buffer available:{' '}
            <strong className="text-white font-mono">
              ₹{data.availableBuffer.toLocaleString('en-IN')}
            </strong>
          </span>
        </div>

        {resolved ? (
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Shortfall absorbed via liquid buffer</span>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setResolved(true);
              if (onSelectRemedy) onSelectRemedy(selectedRemedy);
            }}
            icon={ArrowRight}
            iconPosition="right"
          >
            Execute {selectedRemedy.toUpperCase()} Response
          </Button>
        )}
      </div>
    </Card>
  );
}
