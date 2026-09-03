export default function ScoreGauge({
  score = 742,
  maxScore = 900,
  minScore = 300,
  status = 'GOOD',
}) {
  const percentage = Math.min(
    Math.max((score - minScore) / (maxScore - minScore), 0),
    1
  );

  // Semi-circle SVG coordinates
  const radius = 90;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half-circle
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative py-2">
      <div className="relative w-64 h-36 flex items-end justify-center overflow-hidden">
        <svg className="w-64 h-64 -rotate-180 transform" viewBox="0 0 220 220">
          {/* Background Track Arc */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Numbers */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono tracking-tight">
            {score}
          </span>
          <span className="text-xs font-semibold text-slate-400">
            out of {maxScore}
          </span>
        </div>
      </div>

      {/* Status Pill */}
      <div className="mt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {status}
        </span>
      </div>
    </div>
  );
}
