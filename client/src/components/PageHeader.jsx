import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  showBack = false,
  backTo,
  center = true,
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`mb-8 relative ${center ? 'text-center' : 'text-left'} ${className}`}>
      {showBack && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-4 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

      {badge && (
        <div className="mb-2.5 inline-block">
          <span className="text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {badge}
          </span>
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
