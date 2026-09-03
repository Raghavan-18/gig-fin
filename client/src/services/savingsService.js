import { delay } from './apiClient';
import { MOCK_SAVINGS_GOALS, MOCK_SMART_SAVINGS_RULE } from './mockData';

const SAVINGS_STORAGE_KEY = 'gigfinance_savings_goals';
const TOTAL_SAVED_STORAGE_KEY = 'gigfinance_total_saved';

function getStoredGoals() {
  try {
    const raw = localStorage.getItem(SAVINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_SAVINGS_GOALS;
  } catch {
    return MOCK_SAVINGS_GOALS;
  }
}

function getStoredTotalSaved() {
  try {
    const raw = localStorage.getItem(TOTAL_SAVED_STORAGE_KEY);
    return raw ? Number(raw) : 4200;
  } catch {
    return 4200;
  }
}

export const savingsService = {
  /**
   * Get all goals, total saved, and current smart savings suggestion
   */
  async getSavingsOverview() {
    await delay(200);
    return {
      totalSaved: getStoredTotalSaved(),
      goals: getStoredGoals(),
      smartRule: MOCK_SMART_SAVINGS_RULE,
    };
  },

  /**
   * Allocate funds to a goal (Virtual savings action)
   */
  async addFundsToGoal(goalId, amount) {
    await delay(300);
    const goals = getStoredGoals();
    let updatedTotal = getStoredTotalSaved() + Number(amount);

    const updatedGoals = goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          currentAmount: g.currentAmount + Number(amount),
        };
      }
      return g;
    });

    localStorage.setItem(SAVINGS_STORAGE_KEY, JSON.stringify(updatedGoals));
    localStorage.setItem(TOTAL_SAVED_STORAGE_KEY, updatedTotal.toString());

    return {
      success: true,
      totalSaved: updatedTotal,
      goals: updatedGoals,
      message: `Successfully added ₹${amount} to goal`,
    };
  },

  /**
   * Create a new custom savings goal
   */
  async createGoal({ name, targetAmount, targetDate, category = 'Custom Goal' }) {
    await delay(400);
    const goals = getStoredGoals();

    const newGoal = {
      id: 'goal_' + Date.now(),
      name: name.trim(),
      currentAmount: 0,
      targetAmount: Number(targetAmount),
      targetDate: targetDate || '2026-12-31',
      category,
      iconName: 'Target',
      color: '#3b82f6',
    };

    const updatedGoals = [...goals, newGoal];
    localStorage.setItem(SAVINGS_STORAGE_KEY, JSON.stringify(updatedGoals));

    return {
      success: true,
      goal: newGoal,
      goals: updatedGoals,
    };
  },
};
