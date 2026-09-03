import { delay } from './apiClient';

export const guidanceService = {
  async getGuidanceData() {
    await delay(200);
    return {
      savings: {
        badge: 'Earnings Spike',
        title: 'Your earnings increased this week.',
        observation: 'Your income is 20% higher than your weekly average.',
        recommendation: 'Consider moving ₹200 toward your Bike Repair Fund.',
        actionAmount: 200,
        targetGoalId: 'goal_1',
        targetGoalName: 'Bike Repair Fund',
        buttonText: 'Save ₹200',
      },
      spending: {
        badge: 'Operational Burn',
        title: 'Fuel spending increased by 18% this week.',
        observation: 'You spent ₹1,130 on petrol across HPCL & IOCL over the last 5 days.',
        recommendation: 'Consider setting a weekly fuel budget of ₹1,500 to keep Safe-to-Save buffers intact.',
        actionType: 'budget',
        suggestedBudget: 1500,
        buttonText: 'Set ₹1,500 Fuel Budget',
      },
      safety: {
        badge: 'Emergency Cushion',
        title: 'Emergency savings cover ~8 days of essential expenses.',
        observation: 'Current emergency fund is ₹1,700 against monthly baseline commitments of ₹6,500.',
        recommendation: 'Recommended emergency fund target: ₹5,000 to weather seasonal rain downtime.',
        actionRoute: '/savings',
        buttonText: 'Start Saving',
      },
      credit: {
        badge: 'Score Growth',
        title: 'Your income consistency has improved.',
        observation: 'Your Gig Score increased from 715 → 742 over the past 30 days.',
        recommendation: 'Continue maintaining consistent cash flow and timely UPI bill payments to unlock Tier-1 working capital eligibility.',
        actionRoute: '/gig-score',
        buttonText: 'View Gig Score',
      },
      todayActions: [
        {
          id: 'act_1',
          text: "Save ₹60 from today's payout",
          category: 'Savings',
          completed: false,
        },
        {
          id: 'act_2',
          text: "Keep today's spending below ₹620",
          category: 'Spending',
          completed: false,
        },
        {
          id: 'act_3',
          text: 'Review fuel spending before weekend peak',
          category: 'Review',
          completed: true,
        },
        {
          id: 'act_4',
          text: 'Continue building emergency savings',
          category: 'Safety',
          completed: false,
        },
      ],
    };
  },
};
