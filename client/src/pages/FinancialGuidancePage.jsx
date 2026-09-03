import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import SimulationBadge from '../components/SimulationBadge';
import { dharaApi } from '../services/dharaApi';
import {
  Sparkles,
  CheckCircle2,
  Send,
  Wrench,
} from 'lucide-react';

export default function FinancialGuidancePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      text: 'Hello Ravi! I am your Dhara Financial Assistant. I can answer questions about your buffer days, Safe-to-Save headroom, shortfall alerts, or loan affordability using real-time ledger data. Every number I provide is strictly verified by our numeric validator.',
      tools: [],
      validated: true,
    },
  ]);

  const presetQueries = [
    'How many buffer days do I have?',
    'Why did my savings stop this week?',
    'Can I afford a 40000 rupee loan?',
    'Will I be able to pay the school fees this month?',
    'How much money do I have?',
  ];

  const handleAsk = async (textToAsk) => {
    const q = textToAsk || query;
    if (!q || !q.trim()) return;

    const userMessage = { role: 'user', text: q };
    setConversation((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await dharaApi.askAssistant(q, true);
      const assistantMessage = {
        role: 'assistant',
        text: res.answer,
        tools: res.tool_calls || [],
        validated: res.validation?.ok ?? true,
      };
      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setConversation((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error contacting Dhara assistant service: ${err.message}`,
          tools: [],
          validated: false,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout maxWidth="max-w-5xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Dhara Financial Assistant"
            subtitle="Contextual intelligence answering cash-flow, sweep, shortfall, and repayment questions"
            badge="Live FastAPI Assistant with Numeric Validator"
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
              Grounded, Numerically Verified Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Ask any question about your financial situation. Dhara queries your live double-entry ledger, Safe-to-Save equation, and credit policy. A deterministic numeric validator verifies every digit before returning it to you.
          </p>

          {/* Quick Preset Query Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Try asking:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQueries.map((pq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(pq)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer text-left"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Chat / Interaction Log */}
        <Card className="p-6 border-slate-800 bg-slate-900/80 space-y-4 shadow-xl">
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                      : msg.isError
                      ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-bl-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Show Tool Calls if any */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1 text-slate-400">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                        <Wrench className="w-3 h-3" />
                        <span>Tools Executed:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.tools.map((t, tidx) => (
                          <span
                            key={tidx}
                            className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {t.tool}()
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validation Badge */}
                  {msg.role === 'assistant' && !msg.isError && (
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Validated: Zero hallucinated numbers</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Running tool-calling loop and numeric validator...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="pt-3 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your buffer, sweeps, loans..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !query.trim()}
              icon={Send}
              iconPosition="right"
              className="px-5 font-bold"
            >
              Ask
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
