export default function LoadingState({
  message = 'Processing securely with Account Aggregator...',
  subtext = 'Please do not refresh or close this window',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
        <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 border-r-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-emerald-400 animate-spin-reverse" />
      </div>
      <h3 className="text-base font-semibold text-white tracking-tight">{message}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>}
    </div>
  );
}
