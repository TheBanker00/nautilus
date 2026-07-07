import type { Transaction } from '../../types/transactions';

export const CANONICAL_CATEGORIES = [
  'Housing', 'Bills & Utilities', 'Groceries', 'Dining & Restaurants',
  'Transportation', 'Shopping', 'Entertainment', 'Health & Wellness',
  'Travel', 'Financial', 'Family & Education', 'Miscellaneous',
] as const;

export type CanonicalCategory = typeof CANONICAL_CATEGORIES[number];

export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Housing':             ['Mortgage', 'Rent', 'Repairs', 'Home Improvement', 'Furniture', 'Hardware', 'Security'],
  'Bills & Utilities':   ['Gas & Electric', 'Internet & Cable', 'Phone', 'Water', 'Insurance', 'Waste', 'Utilities'],
  'Groceries':           ['Groceries', 'Alcohol'],
  'Dining & Restaurants':['Restaurant', 'Fast Food', 'Coffee', 'Food & Drink', 'Vending'],
  'Transportation':      ['Car Payment', 'Gas', 'Parking', 'Transit', 'Ride Share', 'Tolls', 'Automotive', 'Bikes & Scooters'],
  'Shopping':            ['Clothing & Accessories', 'Electronics', 'Online Marketplaces', 'Superstores', 'Department Stores', 'Discount Stores', 'Convenience Stores', 'Sporting Goods', 'Office Supplies', 'Gifts & Novelties', 'Books & News', 'Other Merchandise'],
  'Entertainment':       ['TV & Movies', 'Music & Audio', 'Video Games', 'Events & Attractions', 'Gambling', 'Other Entertainment'],
  'Health & Wellness':   ['Primary Care', 'Pharmacy & Supplements', 'Fitness', 'Hair & Beauty', 'Dental Care', 'Eye Care', 'Nursing Care', 'Veterinary Services', 'Laundry & Dry Cleaning', 'Other Personal Care', 'Other Medical'],
  'Travel':              ['Flights', 'Lodging', 'Rental Car', 'Travel'],
  'Financial':           ['Interest Charge', 'ATM Fees', 'Late Fee', 'Overdraft Fee', 'Insufficient Funds Fee', 'Cash Advance Fee', 'Foreign Transaction Fee', 'Other Bank Fees', 'Accounting & Financial Planning', 'Consulting & Legal', 'Government Services'],
  'Family & Education':  ['Student Loan Payment', 'Childcare', 'Education Services', 'Pet Supplies'],
  'Miscellaneous':       ['Donations', 'Tobacco & Vape', 'Postage & Shipping', 'Storage', 'Other Services', 'Other Government/Nonprofit', 'Other'],
};

// Income grouped into two buckets for the budget income table
export const INCOME_GROUPS = {
  'Payroll Income': ['Salary', 'Military Pay', 'Contractor Income', 'Gig Work'],
  'Other Income':   ['Rental Income', 'Dividends', 'Interest', 'Child Support',
                     'Disability Income', 'Pension', 'Unemployment Benefits',
                     'Tax Refund', 'Other Income', 'Investment Income', 'Business Income'],
} as const;

export type IncomeGroupName = keyof typeof INCOME_GROUPS;

export interface IncomeGroupData {
  group:            IncomeGroupName;
  historicalAvg:    number;
  confidence:       number;
  confidenceReason: string;
  trendDirection:   'up' | 'down' | 'stable';
  trendPct:         number;
  spanMonths:       number;
  monthsOfData:     number;
  ytdIncome:        number;
  ytdMonths:        number;
}

// Subcategories that hold their value when a parent budget changes
export const FIXED_SUBCATEGORIES = new Set([
  'Mortgage', 'Rent', 'Car Payment', 'Student Loan Payment',
  'Internet & Cable', 'Phone', 'Water', 'Gas & Electric',
]);

const DEFAULT_BUDGETS: Record<string, number> = {
  'Housing': 1800, 'Bills & Utilities': 350, 'Groceries': 600,
  'Dining & Restaurants': 400, 'Transportation': 500, 'Shopping': 300,
  'Entertainment': 150, 'Health & Wellness': 200, 'Travel': 200,
  'Financial': 100, 'Family & Education': 200, 'Miscellaneous': 100,
};

export interface SubcategoryBudgetData {
  subcategory:      string;
  historicalAvg:    number;
  suggestedBudget:  number;
  historicalWeight: number;
  ytdSpend:         number;
  confidence:       number;
  isFixed:          boolean;
}

export interface CategoryBudgetData {
  category:         string;
  historicalAvg:    number;   // total span spend ÷ span months
  suggestedBudget:  number;
  confidence:       number;
  confidenceReason: string;
  type:             'fixed' | 'variable' | 'subscription';
  trendDirection:   'up' | 'down' | 'stable';
  trendPct:         number;
  monthsOfData:     number;   // months that had any spend (for display)
  spanMonths:       number;   // full months from first tx to today
  totalSpend:       number;   // lifetime total for this category
  ytdSpend:         number;   // current calendar year spend
  ytdMonths:        number;   // months elapsed in current year
  isLumpy:          boolean;  // sparse high-variance — benefits from annual view
  subcategories:    SubcategoryBudgetData[];
  needsAttention:   boolean;
  attentionMessage: string;
}

export interface SmartBudgetResult {
  categories:           CategoryBudgetData[];
  incomeGroups:         IncomeGroupData[];
  totalSuggestedBudget: number;
  spanMonths:           number;
  historyLabel:         string;
  monthlyIncome:        number;
  monthlyExpenses:      number;
  projectedSavings:     number;
  hasHistory:           boolean;
  currentYear:          number;
  ytdMonths:            number;
}

// ── Helpers ──────────────────────────────────────────────────
function avg(vals: number[]) {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
function stdDev(vals: number[]) {
  if (vals.length < 2) return 0;
  const m = avg(vals);
  return Math.sqrt(avg(vals.map(v => (v - m) ** 2)));
}
function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}
function currentYYYYMM(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function previousMonthYYYYMM(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function windowStartYYYYMM(monthsBack: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateSmartBudget(transactions: Transaction[]): SmartBudgetResult {
  const expenses = transactions.filter(t => t.transaction_type === 'Expense');
  const income   = transactions.filter(t => t.transaction_type === 'Income');

  // Monthly income — same 12-month cap, broken into subcategory grid
  const incomeCutoff    = windowStartYYYYMM(12);
  const prevMonth       = previousMonthYYYYMM();  // last fully-completed month
  const incomeGrid: Record<string, Record<string, number>> = {};  // month → subcategory → amount
  for (const t of income) {
    const m   = t.date?.slice(0, 7);
    if (!m || m < incomeCutoff || m > prevMonth) continue;
    const sub = t.subcategory || t.category || 'Other Income';
    if (!incomeGrid[m]) incomeGrid[m] = {};
    incomeGrid[m][sub] = (incomeGrid[m][sub] || 0) + Math.abs(Number(t.amount || 0));
  }
  const incomeMonths = Object.keys(incomeGrid).sort();
  const incomeFirstMonth = incomeMonths[0] || currentYYYYMM();
  const incomeLastMonth  = incomeMonths[incomeMonths.length - 1] || currentYYYYMM();
  const incomeSpan = incomeMonths.length > 0 ? monthsBetween(incomeFirstMonth, incomeLastMonth) + 1 : 0;

  // Overall monthly income for summary strip
  const monthlyIncome = incomeSpan > 0
    ? incomeMonths.reduce((s, m) => s + Object.values(incomeGrid[m]).reduce((a, b) => a + b, 0), 0) / incomeSpan
    : 0;

  // Build monthly spending grid: month → category → subcategory → amount
  const grid: Record<string, Record<string, Record<string, number>>> = {};
  for (const t of expenses) {
    const m   = t.date?.slice(0, 7); if (!m || m > prevMonth) continue;
    const cat = t.category    || 'Miscellaneous';
    const sub = t.subcategory || cat;
    const amt = Math.abs(Number(t.amount || 0));
    if (!grid[m])       grid[m]       = {};
    if (!grid[m][cat])  grid[m][cat]  = {};
    grid[m][cat][sub] = (grid[m][cat][sub] || 0) + amt;
  }

  const todayMM    = currentYYYYMM();
  const cutoff     = windowStartYYYYMM(12);   // 12-month lookback window

  // Only include months within the 12-month window
  const allMonths  = Object.keys(grid).sort().filter(m => m >= cutoff);
  const firstMonth = allMonths[0] || todayMM;
  const lastMonth  = allMonths[allMonths.length - 1] || todayMM;

  // Span = range from first to last completed month with data.
  // Current in-progress month is excluded at ingestion (m > prevMonth filter above),
  // so gaps within the range (e.g. no travel in May) are correctly counted as $0.
  const spanMonths = allMonths.length > 0 ? monthsBetween(firstMonth, lastMonth) + 1 : 0;

  // Current year context
  const currentYear = new Date().getFullYear();
  const ytdMonths   = new Date().getMonth() + 1; // Jan=1 … Dec=12
  const yearPrefix  = `${currentYear}-`;

  const recentMonths = allMonths.slice(-3);
  const priorMonths  = allMonths.slice(0, -3);

  // Overall monthly expenses: total ÷ span (not avg of active months)
  const totalAllExpenses = allMonths.reduce((sum, m) =>
    sum + Object.values(grid[m]).reduce((cs, sm) => cs + Object.values(sm).reduce((a, b) => a + b, 0), 0), 0
  );
  const monthlyExpenses = spanMonths > 0 ? totalAllExpenses / spanMonths : 0;

  const categories: CategoryBudgetData[] = CANONICAL_CATEGORIES.map(category => {
    // Total lifetime spend for this category
    const totalSpend = allMonths.reduce((sum, m) =>
      sum + Object.values(grid[m]?.[category] || {}).reduce((a, b) => a + b, 0), 0
    );

    // Historical average = total ÷ full span (lumpy categories correctly smoothed)
    const historicalAvg = spanMonths > 0 ? totalSpend / spanMonths : 0;

    // Active months (months with any spending) — used for confidence & trend only
    const monthlyTotals = allMonths
      .map(m => Object.values(grid[m]?.[category] || {}).reduce((a, b) => a + b, 0))
      .filter(v => v > 0);

    // CV still based on active months (measures volatility of spend when it happens)
    const cv = monthlyTotals.length >= 2 ? stdDev(monthlyTotals) / (avg(monthlyTotals) || 1) : 0;

    // YTD spend (current calendar year)
    const ytdSpend = allMonths
      .filter(m => m.startsWith(yearPrefix))
      .reduce((sum, m) => sum + Object.values(grid[m]?.[category] || {}).reduce((a, b) => a + b, 0), 0);

    // Lumpy = sparse relative to span AND high variance when it does occur
    const sparsity = monthlyTotals.length / Math.max(spanMonths, 1);
    const isLumpy  = sparsity < 0.5 && cv > 0.4 && totalSpend > 0;

    // Recent trend: compare last 3 active months to overall per-active-month avg
    const activeAvg = avg(monthlyTotals);
    const recentAvg = avg(
      recentMonths
        .map(m => Object.values(grid[m]?.[category] || {}).reduce((a, b) => a + b, 0))
        .filter(v => v > 0)
    );
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendPct = 0;
    if (activeAvg > 0 && recentAvg > 0 && priorMonths.length > 0) {
      trendPct = Math.round(((recentAvg - activeAvg) / activeAvg) * 100);
      if (trendPct >  8) trendDirection = 'up';
      if (trendPct < -8) trendDirection = 'down';
    }

    // Confidence — rewards more months in span AND consistency
    const spanBonus   = Math.min(40, spanMonths * 3);
    const consistBonus = Math.max(0, 60 - cv * 100);
    let confidence = Math.min(95, Math.round(spanBonus + consistBonus));
    if (isLumpy) confidence = Math.min(50, confidence);
    if (!totalSpend) confidence = 20;

    // Type classification
    const type: CategoryBudgetData['type'] =
      cv < 0.1 && historicalAvg > 0 ? 'subscription' :
      cv < 0.2 && historicalAvg > 0 ? 'fixed' : 'variable';

    // Suggested budget (per month)
    let suggestedBudget = historicalAvg > 0
      ? (type === 'variable' ? historicalAvg * 1.1 : type === 'fixed' ? historicalAvg * 1.02 : historicalAvg)
      : DEFAULT_BUDGETS[category] || 0;
    if (trendDirection === 'up' && recentAvg > 0) suggestedBudget = Math.max(suggestedBudget, (recentAvg / spanMonths) * 1.05);
    suggestedBudget = Math.round(suggestedBudget);

    const confidenceReason =
      !totalSpend             ? 'No spending history — using suggested default' :
      isLumpy                 ? `Irregular spending: ${monthlyTotals.length} of ${spanMonths} months — averaged over full period` :
      type === 'subscription' ? `Very consistent spending across ${spanMonths} months` :
      trendDirection === 'up' ? `Spending increased ${trendPct}% in the last 3 months` :
      trendDirection === 'down' ? `Spending decreased ${Math.abs(trendPct)}% recently` :
                                  `Based on ${spanMonths} month${spanMonths !== 1 ? 's' : ''} of history`;

    const needsAttention   = trendDirection === 'up' && trendPct > 10;
    const attentionMessage = needsAttention ? `${category} spending increased ${trendPct}% recently` : '';

    // ── Subcategory analysis ──────────────────────────────────
    const canonicalSubs = CATEGORY_SUBCATEGORIES[category] || [];
    const subTotals: Record<string, number>   = {};
    const subMonths: Record<string, number[]> = {};
    for (const sub of canonicalSubs) { subTotals[sub] = 0; subMonths[sub] = []; }

    for (const m of allMonths) {
      for (const [sub, amt] of Object.entries(grid[m]?.[category] || {})) {
        subTotals[sub] = (subTotals[sub] || 0) + amt;
        if (!subMonths[sub]) subMonths[sub] = [];
        subMonths[sub].push(amt);
      }
    }

    const totalSubSpend = Object.values(subTotals).reduce((a, b) => a + b, 0) || 1;

    const subcategories: SubcategoryBudgetData[] = canonicalSubs.map(sub => {
      const subTotal   = subTotals[sub] || 0;
      const subHistAvg = spanMonths > 0 ? subTotal / spanMonths : 0;
      const weight     = subTotal / totalSubSpend;
      const subCV      = subMonths[sub]?.length >= 2 ? stdDev(subMonths[sub]) / (avg(subMonths[sub]) || 1) : 0;
      const subConf    = Math.min(95, Math.round(
        Math.min(40, (subMonths[sub]?.length || 0) * 4) + Math.max(0, 60 - subCV * 100)
      ));
      const subYtd = allMonths
        .filter(m => m.startsWith(yearPrefix))
        .reduce((s, m) => s + (grid[m]?.[category]?.[sub] || 0), 0);

      return {
        subcategory:      sub,
        historicalAvg:    Math.round(subHistAvg),
        suggestedBudget:  Math.round(suggestedBudget * weight),
        historicalWeight: weight,
        ytdSpend:         Math.round(subYtd),
        confidence:       subMonths[sub]?.length ? subConf : 20,
        isFixed:          FIXED_SUBCATEGORIES.has(sub),
      };
    });

    return {
      category, historicalAvg: Math.round(historicalAvg), suggestedBudget,
      confidence, confidenceReason, type, trendDirection,
      trendPct: Math.abs(trendPct), monthsOfData: monthlyTotals.length,
      spanMonths, totalSpend: Math.round(totalSpend),
      ytdSpend: Math.round(ytdSpend), ytdMonths,
      isLumpy, subcategories, needsAttention, attentionMessage,
    };
  });

  // ── Income group calculations ─────────────────────────────
  const incomeRecentMonths = incomeMonths.slice(-3);
  const incomePriorMonths  = incomeMonths.slice(0, -3);

  const incomeGroups: IncomeGroupData[] = (Object.entries(INCOME_GROUPS) as [IncomeGroupName, readonly string[]][]).map(([group, subcats]) => {
    const subSet = new Set(subcats);
    const totalGroupIncome = incomeMonths.reduce((s, m) =>
      s + Object.entries(incomeGrid[m] || {}).reduce((gs, [sub, amt]) => gs + (subSet.has(sub as never) ? amt : 0), 0), 0
    );
    const histAvg = incomeSpan > 0 ? totalGroupIncome / incomeSpan : 0;

    const monthlyTotals = incomeMonths
      .map(m => Object.entries(incomeGrid[m] || {}).reduce((s, [sub, amt]) => s + (subSet.has(sub as never) ? amt : 0), 0))
      .filter(v => v > 0);

    const cv = monthlyTotals.length >= 2 ? stdDev(monthlyTotals) / (avg(monthlyTotals) || 1) : 0;

    const recentAvg = avg(incomeRecentMonths
      .map(m => Object.entries(incomeGrid[m] || {}).reduce((s, [sub, amt]) => s + (subSet.has(sub as never) ? amt : 0), 0))
      .filter(v => v > 0));
    const activeAvg = avg(monthlyTotals);
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendPct = 0;
    if (activeAvg > 0 && recentAvg > 0 && incomePriorMonths.length > 0) {
      trendPct = Math.round(((recentAvg - activeAvg) / activeAvg) * 100);
      if (trendPct > 8)  trendDirection = 'up';
      if (trendPct < -8) trendDirection = 'down';
    }

    const confidence = !totalGroupIncome ? 20 :
      Math.min(95, Math.round(Math.min(40, incomeSpan * 3) + Math.max(0, 60 - cv * 100)));

    const confidenceReason = !totalGroupIncome
      ? 'No income history in this period'
      : `Based on ${incomeSpan} month${incomeSpan !== 1 ? 's' : ''} of history`;

    const ytdIncome = incomeMonths
      .filter(m => m.startsWith(yearPrefix))
      .reduce((s, m) => s + Object.entries(incomeGrid[m] || {}).reduce((gs, [sub, amt]) => gs + (subSet.has(sub as never) ? amt : 0), 0), 0);

    return {
      group, historicalAvg: Math.round(histAvg), confidence, confidenceReason,
      trendDirection, trendPct: Math.abs(trendPct),
      spanMonths: incomeSpan, monthsOfData: monthlyTotals.length,
      ytdIncome: Math.round(ytdIncome), ytdMonths,
    };
  });

  const totalSuggestedBudget = categories.reduce((s, c) => s + c.suggestedBudget, 0);
  const historyLabel =
    spanMonths >= 12 ? '12+ months' :
    spanMonths >= 1  ? `${spanMonths} month${spanMonths === 1 ? '' : 's'}` :
    'no history';

  return {
    categories, incomeGroups, totalSuggestedBudget, spanMonths, historyLabel,
    monthlyIncome, monthlyExpenses,
    projectedSavings: monthlyIncome - totalSuggestedBudget,
    hasHistory: allMonths.length > 0,
    currentYear, ytdMonths,
  };
}
