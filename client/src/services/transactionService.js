import { delay } from './apiClient';
import { MOCK_TRANSACTIONS } from './mockData';

export const transactionService = {
  /**
   * Get filtered, searched transactions
   */
  async getTransactions({ filter = 'All', search = '', limit } = {}) {
    await delay(250);
    let list = [...MOCK_TRANSACTIONS];

    // Filter by Category or Type
    if (filter && filter !== 'All') {
      if (filter === 'Income') {
        list = list.filter((t) => t.type === 'credit');
      } else if (filter === 'Expenses') {
        list = list.filter((t) => t.type === 'debit');
      } else {
        list = list.filter(
          (t) => t.category.toLowerCase() === filter.toLowerCase()
        );
      }
    }

    // Search query
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.platform.toLowerCase().includes(q)
      );
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    return list;
  },

  /**
   * Get financial summary stats based on current transactions
   */
  async getTransactionSummary() {
    await delay(150);
    const totalIncome = MOCK_TRANSACTIONS
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = MOCK_TRANSACTIONS
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      count: MOCK_TRANSACTIONS.length,
    };
  },
};
