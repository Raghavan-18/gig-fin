import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SimulationBadge from '../components/SimulationBadge';
import TransactionTable from '../components/TransactionTable';
import TransactionFilter from '../components/TransactionFilter';
import AddCashTransactionModal from '../components/AddCashTransactionModal';
import TransactionDetailModal from '../components/TransactionDetailModal';
import Card from '../components/Card';
import Button from '../components/Button';
import { dharaApi } from '../services/dharaApi';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Search,
  Database,
  AlertTriangle,
  RefreshCw,
  Plus,
  Receipt,
} from 'lucide-react';


export default function TransactionsPage() {
  const [filter, setFilter] = useState('All');
  const [verificationFilter, setVerificationFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });
  const [evidence, setEvidence] = useState({
    total_manual_cash: 0,
    receipt_verified: 0,
    self_reported: 0,
    aa_verified: 0,
    synthetic_demo: 0,
  });

  // Modal states
  const [isAddCashOpen, setIsAddCashOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const data = await dharaApi.getTransactions({
        filter,
        verification_status: verificationFilter,
        search,
        limit: 250,
      });

      setTransactions(data.transactions || []);
      if (data.summary) {
        setSummary({
          totalIncome: Math.round(data.summary.total_income || 0),
          totalExpenses: Math.round(data.summary.total_expenses || 0),
          netCashFlow: Math.round(data.summary.net_cash_flow || 0),
        });
      }
      if (data.evidence) {
        setEvidence(data.evidence);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [filter, verificationFilter, search]);

  useEffect(() => {
    let active = true;
    dharaApi
      .getTransactions({

        filter,
        verification_status: verificationFilter,
        search,
        limit: 250,
      })
      .then((data) => {
        if (!active) return;
        setTransactions(data.transactions || []);
        if (data.summary) {
          setSummary({
            totalIncome: Math.round(data.summary.total_income || 0),
            totalExpenses: Math.round(data.summary.total_expenses || 0),
            netCashFlow: Math.round(data.summary.net_cash_flow || 0),
          });
        }
        if (data.evidence) {
          setEvidence(data.evidence);
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
    };
  }, [filter, verificationFilter, search]);

  const handleCashAdded = (newTxn) => {
    // Refresh list from backend to maintain single source of truth
    fetchTransactions(false);
    if (newTxn) {
      setSelectedTransaction(newTxn);
    }
  };

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Transactions"
            subtitle="Double-entry statement stream with proof-based cash verification"
            badge="Live FastAPI Stream"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              iconPosition="left"
              onClick={() => setIsAddCashOpen(true)}
              className="shadow-lg shadow-blue-600/20 font-bold"
            >
              + Add Cash Transaction
            </Button>
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Clear Explanation Notice Banner (Requirement 1) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/30 border border-blue-500/25 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-300 shadow-md">
          <div className="flex items-start md:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-white">
                Account Aggregator & Cash Proof Flow
              </p>
              <p className="text-slate-400">
                Bank and UPI transactions are automatically imported through the simulated Account Aggregator flow. Cash transactions can be added manually.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              {transactions.length} live records
            </span>
          </div>
        </div>

        {/* Evidence Pill Badges Bar (Requirement 20) */}
        {evidence.total_manual_cash > 0 && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                {evidence.total_manual_cash} Manual Cash Transactions Recorded:
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                ✓ {evidence.receipt_verified} Receipt Verified
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                ⚠ {evidence.self_reported} Self Reported
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading ledger transaction history & cash proofs...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Error loading transactions</p>
            <p className="text-xs text-slate-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTransactions(true)}
              icon={RefreshCw}
              iconPosition="left"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* 3 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Total Income"
                amount={summary.totalIncome}
                trend={{ value: 'Seeded & cash income', isPositive: true }}
                icon={TrendingUp}
                variant="emerald"
                description="Assessed earnings stream"
              />
              <StatCard
                title="Total Expenses"
                amount={summary.totalExpenses}
                trend={{ value: 'Burn, debits & cash', isPositive: false }}
                icon={CreditCard}
                variant="rose"
                description="Operational spend & debits"
              />
              <StatCard
                title="Net Cash Flow"
                amount={summary.netCashFlow}
                trend={{ value: 'Liquidity balance', isPositive: summary.netCashFlow >= 0 }}
                icon={Wallet}
                variant="blue"
                description="Available for S2S & buffer"
              />
            </div>

            {/* Filter, Provenance, and Search Bar */}
            <Card className="p-5 border-slate-800 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <TransactionFilter
                    activeFilter={filter}
                    onFilterChange={setFilter}
                    activeVerificationFilter={verificationFilter}
                    onVerificationFilterChange={setVerificationFilter}
                  />
                </div>

                <div className="relative w-full lg:w-64 flex-shrink-0 self-start lg:self-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search narration, platform, status..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Transactions Table with Verification provenance column */}
              <TransactionTable
                transactions={transactions}
                onSelectTransaction={(txn) => setSelectedTransaction(txn)}
                emptyMessage="No transactions found matching your criteria."
              />
            </Card>
          </>
        )}
      </div>

      {/* Add Cash Transaction Modal */}
      <AddCashTransactionModal
        isOpen={isAddCashOpen}
        onClose={() => setIsAddCashOpen(false)}
        onSuccess={handleCashAdded}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
      />
    </AppLayout>
  );
}
