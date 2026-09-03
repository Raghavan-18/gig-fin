import { useState, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import SimulationBadge from '../components/SimulationBadge';
import TransactionTable from '../components/TransactionTable';
import TransactionFilter from '../components/TransactionFilter';
import Card from '../components/Card';
import { DHARA_TRANSACTIONS } from '../data/dharaData';
import {
  TrendingUp,
  CreditCard,
  Wallet,
  Search,
  Database,
} from 'lucide-react';

export default function TransactionsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTransactions = useMemo(() => {
    return DHARA_TRANSACTIONS.filter((t) => {
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
  }, [filter, search]);

  const summary = {
    totalIncome: 24850,
    totalExpenses: 15420,
    netCashFlow: 9430,
  };

  return (
    <AppLayout maxWidth="max-w-7xl">
      <div className="space-y-6 text-left py-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Transactions"
            subtitle="Synthetic bank & platform payout statement stream"
            badge="Simulated AA Stream"
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
          <span className="text-slate-400 text-[11px]">Seeded 90-day ledger</span>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Income"
            amount={summary.totalIncome}
            trend={{ value: '18% weekly surge', isPositive: true }}
            icon={TrendingUp}
            variant="emerald"
            description="Swiggy, Zomato, Uber, Porter payouts"
          />
          <StatCard
            title="Total Expenses"
            amount={summary.totalExpenses}
            trend={{ value: 'Rent & Fuel', isPositive: false }}
            icon={CreditCard}
            variant="rose"
            description="Operational burn & obligations"
          />
          <StatCard
            title="Net Cash Flow"
            amount={summary.netCashFlow}
            trend={{ value: 'Buffer Surplus', isPositive: true }}
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
                placeholder="Search description, platform..."
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
      </div>
    </AppLayout>
  );
}
