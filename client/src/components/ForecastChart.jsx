import { useState } from 'react';
import Card from './Card';
import { TrendingUp, Info } from 'lucide-react';
import { DHARA_INCOME_FORECAST } from '../data/dharaData';

export default function ForecastChart({
  forecast = DHARA_INCOME_FORECAST,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('projected'); // 'projected' or 'historical'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const series = activeTab === 'projected' ? forecast.projected14d : forecast.historicalTrend;
  const maxVal = 2200;

  return (
    <Card className={`p-6 border-slate-800 text-left ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base sm:text-lg text-white">
              Income Forecast
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your expected income range based on recent cash-flow patterns.
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('projected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'projected'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            14-Day Forecast (p10 - p90)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'historical'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Historical Trend
          </button>
        </div>
      </div>

      {/* Quantile Metrics Strip */}
      {activeTab === 'projected' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              p10 (Stress Floor)
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              ₹{forecast.quantiles.p10}
            </span>
            <span className="text-[10px] text-slate-500 block">90% chance to exceed</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <span className="text-[10px] uppercase font-bold text-blue-400 block">
              p20 (S2S Baseline)
            </span>
            <span className="text-base font-extrabold text-blue-300 font-mono">
              ₹{forecast.quantiles.p20}
            </span>
            <span className="text-[10px] text-blue-300/70 block">Conservative planning</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              p50 (Median)
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              ₹{forecast.quantiles.p50}
            </span>
            <span className="text-[10px] text-slate-500 block">Expected typical day</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-[10px] uppercase font-bold text-purple-400 block">
              p90 (Peak Surge)
            </span>
            <span className="text-base font-extrabold text-white font-mono">
              ₹{forecast.quantiles.p90}
            </span>
            <span className="text-[10px] text-slate-500 block">Surge skim trigger</span>
          </div>
        </div>
      )}

      {/* Responsive Visual Forecast Range Chart */}
      <div className="h-56 sm:h-64 flex items-end gap-1.5 sm:gap-2 pt-8 pb-2 px-2 border-b border-slate-800/80 relative">
        {/* Background Guide Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
          <div className="border-b border-slate-500 w-full" />
          <div className="border-b border-slate-500 w-full" />
          <div className="border-b border-slate-500 w-full" />
        </div>

        {activeTab === 'projected'
          ? series.map((item, idx) => {
              const p90Height = (item.p90 / maxVal) * 100;
              const p50Height = (item.p50 / maxVal) * 100;
              const p20Height = (item.p20 / maxVal) * 100;
              const isHovered = hoveredPoint === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-20 z-20 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-left pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 text-xs">
                      <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
                        {item.date} ({item.day})
                      </div>
                      <div className="text-purple-300">p90 Peak: ₹{item.p90}</div>
                      <div className="text-emerald-400 font-semibold">p50 Median: ₹{item.p50}</div>
                      <div className="text-blue-400">p20 Conservative: ₹{item.p20}</div>
                      <div className="text-rose-400">p10 Stress: ₹{item.p10}</div>
                    </div>
                  )}

                  {/* Quantile Band Bar */}
                  <div className="w-full max-w-[20px] flex flex-col items-center justify-end h-full relative">
                    {/* p90 outer range */}
                    <div
                      className="w-full rounded-t-sm bg-purple-500/20 absolute bottom-0 transition-all group-hover:bg-purple-500/30"
                      style={{ height: `${p90Height}%` }}
                    />
                    {/* p50 median */}
                    <div
                      className="w-full rounded-t-sm bg-emerald-500/40 absolute bottom-0 transition-all group-hover:bg-emerald-500/60"
                      style={{ height: `${p50Height}%` }}
                    />
                    {/* p20 conservative floor */}
                    <div
                      className="w-full rounded-t-sm bg-blue-500 absolute bottom-0 transition-all group-hover:bg-blue-400"
                      style={{ height: `${p20Height}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center group-hover:text-white">
                    {item.date.split(' ')[0]}
                  </span>
                </div>
              );
            })
          : series.map((item, idx) => {
              const height = (item.actual / maxVal) * 100;
              const isHovered = hoveredPoint === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-12 z-20 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-center pointer-events-none whitespace-nowrap text-xs font-mono font-bold text-emerald-400">
                      {item.date}: ₹{item.actual}
                    </div>
                  )}
                  <div
                    className="w-full max-w-[16px] rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all group-hover:brightness-125"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">
                    {item.date.split(' ')[0]}
                  </span>
                </div>
              );
            })}
      </div>

      {/* Legend & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>p20 (Safe Floor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
            <span>p50 (Median Day)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-purple-500/25" />
            <span>p90 (Surge Potential)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Derived from seeded synthetic timeseries</span>
        </div>
      </div>
    </Card>
  );
}
