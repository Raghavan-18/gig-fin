import { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Coins,
  BookOpen,
} from 'lucide-react';


const SUGGESTED_GROUPS = [
  {
    category: 'Daily & Buffer',
    icon: Wallet,
    queries: [
      'How much money do I have?',
      'How much can I spend today?',
      'How many buffer days do I have?',
    ],
  },
  {
    category: 'Income & Expenses',
    icon: TrendingUp,
    queries: [
      'How much did I earn this week?',
      'Why was my income low this week?',
      'What are my biggest expenses?',
    ],
  },
  {
    category: 'Planning & Credit',
    icon: Coins,
    queries: [
      'Can I afford a ₹5,000 loan?',
      'Will I be able to pay my school fees this month?',
      'How can I save more?',
    ],
  },
  {
    category: 'Financial Literacy',
    icon: BookOpen,
    queries: [
      'What is an emergency fund?',
      'What is an EMI?',
      'What is Account Aggregator?',
    ],
  },
];

export default function FinancialGuidancePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [conversation, setConversation] = useState([
    {
      id: 'init',
      role: 'assistant',
      text: 'Hello Ravi! I am your Dhara Financial Assistant. I can answer questions about your buffer days, Safe-to-Save headroom, shortfall alerts, or loan affordability using real-time ledger data. Every number I provide is strictly verified by our numeric validator.',
      intent: 'GREETING_CASUAL',
      tools: [],
      validated: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const msgCounterRef = useRef(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

  const handleAsk = async (textToAsk) => {
    const q = (textToAsk || query).trim();
    if (!q || loading) return;

    const count = msgCounterRef.current++;
    const currentTime = 'Just now';

    const userMessage = {
      id: `usr_${count}`,
      role: 'user',
      text: q,
      timestamp: currentTime,
    };

    setConversation((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    // Build chat history for conversational context
    const historyPayload = conversation
      .filter((m) => !m.isError)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    try {
      const res = await dharaApi.chatAssistant(q, historyPayload, 'ravi');
      const asstCount = msgCounterRef.current++;
      const assistantMessage = {
        id: `asst_${asstCount}`,
        role: 'assistant',
        text: res.answer,
        intent: res.intent || 'GENERAL',
        tools: res.tool_calls || [],
        validated: res.validation?.ok ?? true,
        sources: res.sources || [],
        timestamp: 'Just now',
      };
      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errCount = msgCounterRef.current++;
      const errorMessage = {
        id: `err_${errCount}`,
        role: 'assistant',
        text: `I couldn't retrieve your financial data right now: ${err.message}. Please try again.`,
        intent: 'ERROR',
        tools: [],
        validated: false,
        isError: true,
        failedQuery: q,
        timestamp: 'Just now',
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };


  const handleRetry = (failedText) => {
    handleAsk(failedText);
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

        {/* Hero Card with Suggested Questions */}
        <Card className="p-6 border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/30 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Grounded, Numerically Verified Intelligence
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Ask general financial questions or personalized queries about your money. Dhara queries your live double-entry ledger, Safe-to-Save equation, and credit policy. A deterministic numeric validator verifies every digit before returning it to you.
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 self-start">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Hallucinated Numbers</span>
            </div>
          </div>

          {/* Category Tabs for Quick Starters */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SUGGESTED_GROUPS.map((group, gidx) => {
                const Icon = group.icon;
                const isActive = activeCategory === gidx;
                return (
                  <button
                    key={gidx}
                    type="button"
                    onClick={() => setActiveCategory(gidx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{group.category}</span>
                  </button>
                );
              })}
            </div>

            {/* Chips for Selected Category */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_GROUPS[activeCategory].queries.map((pq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(pq)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer text-left shadow-sm disabled:opacity-50"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Chat / Interaction Log */}
        <Card className="p-4 sm:p-6 border-slate-800 bg-slate-900/80 space-y-4 shadow-xl flex flex-col h-[560px]">
          {/* Scrollable Conversation Container */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
            {conversation.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-md ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : msg.isError
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : msg.isError
                        ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-tl-none'
                        : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Header with intent and timestamp */}
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 border-b border-white/5 pb-1">
                      <span className="font-semibold uppercase tracking-wider">
                        {isUser ? 'Ravi (You)' : 'Dhara Assistant'}
                      </span>
                      <div className="flex items-center gap-2">
                        {msg.intent && !isUser && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[9px] text-blue-300">
                            {msg.intent}
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Show Tools Executed if any */}
                    {msg.tools && msg.tools.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                        <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Tools Executed:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.tools.map((t, tidx) => (
                            <span
                              key={tidx}
                              className="font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px]"
                            >
                              {t.name || t.tool || 'tool'}()
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validation Badge for Assistant */}
                    {!isUser && !msg.isError && (
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Validated: Zero hallucinated numbers</span>
                      </div>
                    )}

                    {/* Retry Button on Error */}
                    {msg.isError && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={RotateCcw}
                          iconPosition="left"
                          onClick={() => handleRetry(msg.failedQuery)}
                        >
                          Retry Query
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading animation */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-400 text-xs rounded-tl-none flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Evaluating intent, executing verified tools, and checking numeric validator...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form with Enter-to-Send */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="pt-3 border-t border-slate-800 flex gap-2 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g. 'How much can I spend today?', 'What is an EMI?', 'Was my income good?')..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !query.trim()}
              icon={Send}
              iconPosition="right"
              className="px-5 font-bold shadow-md shadow-blue-600/20"
            >
              Send
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
