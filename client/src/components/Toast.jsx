import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Toast() {
  const { toast, clearToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-slate-900/95 text-slate-100',
    error: 'border-rose-500/30 bg-slate-900/95 text-slate-100',
    info: 'border-blue-500/30 bg-slate-900/95 text-slate-100',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center justify-between gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${
          borders[toast.type] || borders.info
        }`}
      >
        <div className="flex items-center gap-3">
          {icons[toast.type] || icons.info}
          <p className="text-xs sm:text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
