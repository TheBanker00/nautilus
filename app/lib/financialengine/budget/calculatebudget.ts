export function calculateBudget(
  income: number,
  expenses: number
) {
  return {
    recommendedSavingsRate: 20,
    recommendedBudget: income * 0.8,
    overspendRisk: expenses > income * 0.9,
  };
}