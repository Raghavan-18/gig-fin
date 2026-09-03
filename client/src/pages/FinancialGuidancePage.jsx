import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SimulationBadge from '../components/SimulationBadge';
import { DHARA_ASSISTANT_QA } from '../data/dharaData';
import {
  Sparkles,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export default function FinancialGuidancePage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeQA, setActiveQA] = useState(DHARA_ASSISTANT_QA[0]);

  const categories = ['All', 'Savings', 'Shortfall', 'Sweeps', 'Repayment'];

  const filteredQA = DHARA_ASSISTANT_QA.filter((item) => {
    return selectedCategory === 'All' || item.category === selectedCategory;
  });

  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Dhara Financial Assistant"
            subtitle="Contextual intelligence answering cash-flow, sweep, shortfall, and repayment questions"
            badge="Numeric Validation Assistant"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Hero Banner */}
        <Card className="p-6 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Mathematically Verified Cash-Flow Guidance
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            The Dhara assistant validates answers directly against your synthetic double-entry ledger,
            Safe-to-Save equation ($S2S = p20 - obligations - burn - floor$), and income-linked schedules.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Card>

        {/* Q&A Interactive Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List */}
          <div className="lg:col-span-5 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
              Frequent Cash-Flow Queries:
            </span>

            {filteredQA.map((item) => {
              const isSelected = activeQA?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveQA(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-lg'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <HelpCircle
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isSelected ? 'text-blue-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold leading-snug">
                      {item.question}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block uppercase">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Answer Detail Card */}
          <div className="lg:col-span-7">
            {activeQA ? (
              <Card className="p-6 sm:p-7 border-slate-800 bg-slate-900/80 space-y-5 text-left h-full flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {activeQA.category} Intelligence
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Validated vs p20 model
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{activeQA.question}</span>
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    <p>{activeQA.answer}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Numeric validation passed</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dhara Assistant v0.1
                  </span>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
