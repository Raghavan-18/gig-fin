import { ShieldAlert } from 'lucide-react';

export default function SimulationBadge({ className = '', size = 'sm' }) {
  const sizes = {
    xs: 'text-[9px] px-2 py-0.5 gap-1',
    sm: 'text-[10px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25 select-none ${sizes[size]} ${className}`}
      title="This environment runs over simulated Account Aggregator and synthetic financial datasets"
    >
      <ShieldAlert className="w-3 h-3 text-amber-400 flex-shrink-0" />
      <span>DEMO · SIMULATED AA · SYNTHETIC DATA</span>
    </div>
  );
}
