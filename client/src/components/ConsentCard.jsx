import { CheckCircle2, ShieldCheck, Lock, EyeOff } from 'lucide-react';

export default function ConsentCard({
  items = [
    { title: 'Transaction History', subtitle: 'To detect gig payouts, irregular income patterns, and recurring expenses' },
    { title: 'Account Balance', subtitle: 'To compute accurate Safe-to-Save buffer and protect liquidity floor' },
    { title: 'Account Information', subtitle: 'Account type and verification of primary account ownership' },
  ],
  showShield = true,
}) {
  return (
    <div className="space-y-4 text-left">
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Data Requested For Analysis
        </h4>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60">
              <div className="mt-0.5 p-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showShield && (
        <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Account Aggregator Security</h5>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>256-bit bank-grade encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Read-only: No fund transfers possible</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
