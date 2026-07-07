export type BudgetPeriod =
  | 'monthly'
  | 'quarterly'
  | 'annual';

export type BudgetStatus =
  | 'safe'
  | 'warning'
  | 'over';

export type Budget = {
  id: string;

  category: string;

  limit: number;

  period: BudgetPeriod;

  rollover?: boolean;

  carryForward?: number;

  createdAt?: string;
};

export type BudgetPerformance = {
  category: string;

  budgeted: number;

  spent: number;

  remaining: number;

  percentUsed: number;

  projectedSpend: number;

  projectedVariance: number;

  daysRemaining: number;

  dailyBudgetRemaining: number;

  status: BudgetStatus;

  velocityScore: number;

  trend:
    | 'improving'
    | 'stable'
    | 'worsening';
};