export default function Card({
  children,
  variant = 'glass',
  interactive = false,
  className = '',
  onClick,
  ...props
}) {
  const variants = {
    glass: 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-black/20',
    elevated: 'bg-slate-900 border border-slate-850 shadow-2xl shadow-black/40',
    outline: 'bg-transparent border border-slate-800/90',
    glow: 'bg-slate-900/70 backdrop-blur-xl border border-blue-500/20 shadow-xl shadow-blue-500/5',
  };

  const interactiveStyles = interactive
    ? 'hover:border-blue-500/40 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer transition-all duration-200'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl
        ${variants[variant] || variants.glass}
        ${interactiveStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
