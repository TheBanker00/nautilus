export function calculateCashFlowForecast(
  monthlyIncome: number,
  monthlyExpenses: number
) {
  const projectedSavings =
    monthlyIncome -
    monthlyExpenses;

  return {
    projectedMonthlySavings:
      projectedSavings,

    projectedAnnualSavings:
      projectedSavings * 12,
  };
}