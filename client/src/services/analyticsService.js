import { delay } from './apiClient';
import { MOCK_ANALYTICS_DATA } from './mockData';

export const analyticsService = {
  /**
   * Get main analytics statistical indicators
   */
  async getAnalyticsStats() {
    await delay(200);
    return MOCK_ANALYTICS_DATA.stats;
  },

  /**
   * Get chart series data by timeframe (daily, weekly, monthly)
   */
  async getCashFlowChart(timeframe = 'weekly') {
    await delay(200);
    const key = timeframe.toLowerCase();
    return MOCK_ANALYTICS_DATA.chartData[key] || MOCK_ANALYTICS_DATA.chartData.weekly;
  },

  /**
   * Get expense category breakdown
   */
  async getExpenseBreakdown() {
    await delay(150);
    return MOCK_ANALYTICS_DATA.expenseCategories;
  },

  /**
   * Get split between gig income and other income
   */
  async getIncomeSplit() {
    await delay(150);
    return MOCK_ANALYTICS_DATA.incomeSplit;
  },

  /**
   * Get top contextual insight
   */
  async getInsight() {
    await delay(100);
    return MOCK_ANALYTICS_DATA.insight;
  },
};
