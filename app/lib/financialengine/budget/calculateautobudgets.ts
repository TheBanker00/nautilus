import { Transaction } from '../../types/transactions';

export type AutoBudget = {
  category: string;

  // recommended monthly budget
  recommendedMonthly: number;

  // actual avg monthly spend
  avgMonthlySpend: number;

  // stability score (0–100)
  stabilityScore: number;

  // variability (how volatile spending is)
  variabilityScore: number;

  // classification
  type: 'fixed' | 'variable' | 'subscription';

  // confidence in recommendation
  confidence: number;
};

function groupByCategory(transactions: Transaction[]) {
  const map: Record<string, Transaction[]> = {};

  for (const t of transactions) {
    const category = t.category || 'Other';
    if (!map[category]) map[category] = [];
    map[category].push(t);
  }

  return map;
}

function average(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length || 0;
}

function stddev(values: number[]) {
  const avg = average(values);
  const variance =
    average(values.map(v => Math.pow(v - avg, 2)));
  return Math.sqrt(variance);
}

export function calculateAutoBudgets(transactions: Transaction[]): AutoBudget[] {
  const expenses = transactions.filter(t => t.transaction_type === 'Expense');
  const grouped = groupByCategory(expenses);

  return Object.entries(grouped).map(([category, items]) => {
    const amounts = items.map(t => Math.abs(Number(t.amount || 0)));

    const avgMonthlySpend = average(amounts);

    const variability = stddev(amounts);

    const stabilityScore = Math.max(
      0,
      100 - (variability / (avgMonthlySpend || 1)) * 100
    );

    // subscription detection (simple but effective baseline)
    const isSubscription =
      items.some(t =>
        t.tags?.includes('recurring')
      ) ||
      stabilityScore > 85 &&
      variability < avgMonthlySpend * 0.15;

    const type: AutoBudget['type'] =
      isSubscription
        ? 'subscription'
        : stabilityScore > 70
        ? 'fixed'
        : 'variable';

    // recommendation logic (Monarch-style smoothing)
    let recommendedMonthly = avgMonthlySpend;

    if (type === 'variable') {
      recommendedMonthly = avgMonthlySpend * 1.15; // buffer
    }

    if (type === 'subscription') {
      recommendedMonthly = avgMonthlySpend; // fixed baseline
    }

    if (type === 'fixed') {
      recommendedMonthly = avgMonthlySpend * 1.02;
    }

    const confidence = Math.min(
      100,
      stabilityScore + (items.length * 2)
    );

    return {
      category,
      recommendedMonthly: Number(recommendedMonthly.toFixed(2)),
      avgMonthlySpend: Number(avgMonthlySpend.toFixed(2)),
      stabilityScore: Number(stabilityScore.toFixed(1)),
      variabilityScore: Number(variability.toFixed(2)),
      type,
      confidence: Number(confidence.toFixed(1)),
    };
  })
  .sort((a, b) => b.recommendedMonthly - a.recommendedMonthly);
}
