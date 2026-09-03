export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helper,
  required = false,
  disabled = false,
  prefix,
  icon: Icon,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center rounded-xl bg-slate-900/80 border border-slate-700/80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden shadow-inner">
        {prefix && (
          <span className="flex items-center pl-3.5 pr-2 py-2.5 text-sm font-semibold text-slate-400 bg-slate-850/50 border-r border-slate-700/60 select-none">
            {prefix}
          </span>
        )}

        {Icon && !prefix && (
          <div className="pl-3.5 text-slate-400 flex items-center pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon && !prefix ? 'pl-2.5' : ''}
            ${error ? 'text-rose-200' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-400 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}

      {helper && !error && (
        <p className="text-xs text-slate-400 mt-1">{helper}</p>
      )}
    </div>
  );
}
