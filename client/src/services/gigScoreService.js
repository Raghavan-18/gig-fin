import { delay } from './apiClient';

export const gigScoreService = {
  async getGigScoreData() {
    await delay(200);
    return {
      score: 742,
      maxScore: 900,
      status: 'GOOD',
      percentile: 'Top 18% of Indian gig workers',
      historicalIncrease: {
        from: 715,
        to: 742,
        change: +27,
      },
      factors: [
        {
          name: 'Income Consistency',
          score: 85,
          rating: 'Very High',
          description: 'Regular weekday and weekend delivery earnings patterns',
          color: '#10b981',
        },
        {
          name: 'Payout Frequency',
          score: 90,
          rating: 'Excellent',
          description: 'Multiple settled payouts per week from Swiggy & Zomato',
          color: '#3b82f6',
        },
        {
          name: 'Cash-flow Stability',
          score: 78,
          rating: 'Good',
          description: 'Safe margin between daily fuel costs and payout inflow',
          color: '#8b5cf6',
        },
        {
          name: 'Balance Behavior',
          score: 82,
          rating: 'Strong',
          description: 'Maintains minimum buffer above zero balance consistently',
          color: '#06b6d4',
        },
        {
          name: 'Savings Behavior',
          score: 70,
          rating: 'Moderate',
          description: 'Active micro-allocations into Bike Repair Fund',
          color: '#f59e0b',
        },
      ],
      strongPoints: [
        'Consistent weekly payouts from primary gig platforms',
        'Stable earning activity across seasonal demand swings',
        'Positive cash-flow behavior with zero overdraft penalties',
        'Regular account activity and transparent transaction history',
      ],
      creditReadiness: {
        status: 'GOOD',
        tier: 'Tier 1 Gig Worker',
        potentialEligibilityAmount: 5000,
        purposeType: 'Working-Capital Micro Line',
        estimatedTerm: '30 - 90 Days',
        disclaimer: 'Final lending decisions are made by eligible financial institutions.',
      },
    };
  },
};
