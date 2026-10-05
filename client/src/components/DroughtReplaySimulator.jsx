import { useState, useEffect, useRef } from 'react';
import Card from './Card';
import Button from './Button';
import { dharaApi } from '../services/dharaApi';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CloudRain,
  Sun,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Calendar,
} from 'lucide-react';

const STAGES = [
  { id: 'normal', label: '1. Normal Week', range: [165, 170], desc: 'Regular gig earnings, steady sweeps' },
  { id: 'shock', label: '2. Income Shock', range: [171, 171], desc: 'Rain arrives, earnings drop suddenly' },
  { id: 'drought', label: '3. Drought Period', range: [172, 175], desc: 'Downside income; sweeps auto-pause' },
  { id: 'recovery', label: '4. Recovery', range: [176, 179], desc: 'Weather clears; sweeps resume + surge skim' },
];

export default function DroughtReplaySimulator({ className = '' }) {
  const [days, setDays] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;
    dharaApi
      .getReplay(165, 179)
      .then((res) => {
        if (!active) return;
        if (res && res.days && res.days.length > 0) {
          setDays(res.days);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= days.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1600);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, days.length]);

  if (loading) {
    return (
      <Card className="p-8 border-slate-800 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Loading drought replay simulator...</p>
      </Card>
    );
  }

  if (error || days.length === 0) {
    return (
      <Card className="p-6 border-slate-800 text-center text-xs text-slate-400">
        Replay simulation data unavailable: {error || 'No records returned'}
      </Card>
    );
  }

  const current = days[currentIndex] || days[0];
  const isDrought = current.is_drought;
  const isPaused = current.paused || current.sweep === 0;
  const currentStage = STAGES.find(
    (s) => current.idx >= s.range[0] && current.idx <= s.range[1]
  ) || STAGES[0];

  const handleSelectStage = (stage) => {
    setIsPlaying(false);
    const targetIdx = days.findIndex((d) => d.idx === stage.range[0]);
    if (targetIdx !== -1) {
      setCurrentIndex(targetIdx);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(days.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  return (
    <Card className={`p-6 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20 shadow-xl space-y-6 text-left ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <h3 className="font-extrabold text-lg text-white">
              Drought Replay Simulator
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/25 uppercase font-mono">
              Live Scenario
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Experience how Dhara automatically protects liquidity during rain droughts and resumes in recovery
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            icon={ChevronLeft}
          />
          <Button
            variant={isPlaying ? 'amber' : 'primary'}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            icon={isPlaying ? Pause : Play}
            iconPosition="left"
          >
            {isPlaying ? 'Pause' : 'Play Scenario'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentIndex === days.length - 1}
            icon={ChevronRight}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            icon={RotateCcw}
            title="Reset to Day 165"
          />
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STAGES.map((stg) => {
          const isActive = currentStage.id === stg.id;
          return (
            <button
              key={stg.id}
              onClick={() => handleSelectStage(stg)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span className={`text-xs font-bold block ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                {stg.label}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 line-clamp-1">
                {stg.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Status Banner */}
      {isDrought ? (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-amber-200">
          <CloudRain className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>🌧️ Drought Protection Active — Savings Sweeps PAUSED</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {current.reason || 'DROUGHT'}
              </span>
            </h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Downside forecast cannot safely cover committed upcoming obligations and essential food/fuel.
              Your money stays in your settlement account for survival — no bounce fees, no forced savings.
            </p>
          </div>
        </div>
      ) : current.idx >= 176 ? (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3 text-emerald-200">
          <Sun className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span>☀️ Recovery Spell Active — Savings Sweeps RESUMED</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                SURGE SKIM
              </span>
            </h4>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Clear weather restored high platform earnings. Safe-to-Save headroom is positive, so micro-sweeps have resumed
              and automatically skim 25% of above-median earnings to quickly rebuild your liquid emergency cushion.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3 text-blue-200">
          <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-300">
              Normal Working Week — Safe Sweeps Active
            </h4>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              Earnings are consistent with personal medians. Small slices (3%) and round-ups are systematically building your buffer.
            </p>
          </div>
        </div>
      )}

      {/* Main Metrics for Current Day */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Timeline</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base font-extrabold text-white font-mono">
            Day {current.idx} <span className="text-xs text-slate-400 font-sans font-normal">({current.weekday})</span>
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {current.date}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Daily Earnings</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-extrabold text-emerald-400 font-mono">
            ₹{Math.round(current.income || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {current.income === 0 ? 'Zero-income day' : 'Platform settlement'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Settlement Balance</span>
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base font-extrabold text-white font-mono">
            ₹{Math.round(current.settlement || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Buffer: ₹{Math.round(current.buffer || 0)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Savings Sweep</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-base font-extrabold font-mono">
            {isPaused ? (
              <span className="text-amber-400">PAUSED</span>
            ) : (
              <span className="text-emerald-400">+₹{Math.round(current.sweep || 0)}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isPaused ? `Reason: ${current.reason || 'Drought'}` : 'Painless micro-sweep'}
          </span>
        </div>
      </div>

      {/* Progress scrubber */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Day 165</span>
          <span className="text-blue-400 font-bold">Currently: Day {current.idx} of 179</span>
          <span>Day 179</span>
        </div>
        <input
          type="range"
          min={0}
          max={days.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIndex(Number(e.target.value));
          }}
          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-800"
        />
      </div>
    </Card>
  );
}
