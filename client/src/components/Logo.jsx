import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', link = true, showBadge = true }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const content = (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold tracking-tight text-white font-display ${sizeClasses[size]}`}>
            Dha<span className="text-blue-500">ra</span>
          </span>
          {showBadge && (
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Demo
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to="/">{content}</Link>;
  }

  return content;
}
