import { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SimulationBadge from '../components/SimulationBadge';
import TransactionTable from '../components/TransactionTable';
import TransactionFilter from '../components/TransactionFilter';
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
} from 'lucide-react';

export default function TransactionsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });

  const processData = (data) => {
    const events = data.sample || [];
    let inc = 0;
    let exp = 0;

    const mapped = events.map((e, idx) => {
      const isCredit = e.kind === 'INCOME';
      const amt = Math.round(Number(e.amount) || 0);
      if (isCredit) inc += amt;
      else exp += amt;

      return {
        id: `tx_${idx}_${e.date}`,
        date: e.date,
        description: e.narration,
        category: e.category || (isCredit ? 'Platform Payout' : 'Daily Burn'),
        type: isCredit ? 'credit' : 'debit',
        amount: amt,
        platform: e.platform || (isCredit ? 'Swiggy / Zomato' : 'UPI Merchant'),
        classificationMethod: e.classification_method || 'Rule-based',
      };
    });

    setTransactions(mapped.reverse());
    setSummary({
      totalIncome: inc,
      totalExpenses: exp,
      netCashFlow: inc - exp,
    });
  };

  const loadTransactions = () => {
    setLoading(true);
    setError(null);
    dharaApi
      .getClassify(120)
      .then((data) => {
        processData(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    dharaApi
      .getClassify(120)
      .then((data) => {
        if (!active) return;
        processData(data);
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
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.platform.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filter === 'All') return true;
      if (filter === 'Income') return t.type === 'credit';
      if (filter === 'Expenses') return t.type === 'debit';
      return t.category.toLowerCase() === filter.toLowerCase();
    });
  }, [transactions, filter, search]);

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Transactions"
            subtitle="Seeded statement stream loaded directly from Dhara FastAPI ledger"
            badge="Live FastAPI Stream"
            center={false}
            className="mb-0"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SimulationBadge size="sm" />
          </div>
        </div>

        {/* Notice Banner */}
        <div className="p-3.5 rounded-xl bg-blue-950/25 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>
              Synthetic statements imported via simulated Account Aggregator. Classification method:{' '}
              <strong className="text-white">Rule-based</strong>.
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            {transactions.length} live events
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading ledger transaction history...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Error loading transactions</p>
            <p className="text-xs text-slate-400">{error}</p>
            <Button variant="outline" size="sm" onClick={loadTransactions} icon={RefreshCw} iconPosition="left">
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
                trend={{ value: 'Seeded events', isPositive: true }}
                icon={TrendingUp}
                variant="emerald"
                description="Platform payouts assessed"
              />
              <StatCard
                title="Total Expenses"
                amount={summary.totalExpenses}
                trend={{ value: 'Daily burn & EMI', isPositive: false }}
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

            {/* Filter and Search Bar */}
            <Card className="p-5 border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <TransactionFilter activeFilter={filter} onFilterChange={setFilter} />

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search narration, platform..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                  />
                </div>
              </div>

              {/* Transactions Table with Rule-based classification column */}
              <TransactionTable
                transactions={filteredTransactions}
                emptyMessage="No transactions found matching your criteria."
              />
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
