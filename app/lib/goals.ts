/* ─────────────────────────────────────────────────────────────
   GOALS — shared types, constants, and math
   Imported by: app/dashboard/goals/page.tsx, app/api/goals/*
───────────────────────────────────────────────────────────── */

/* ── Types ── */
export type FundingStrategy = 'monthly' | 'cash' | 'investments' | 'hybrid' | 'debt';
export type GoalPriority    = 'high' | 'medium' | 'low';

export type GoalCategoryKey =
  | 'home' | 'emergency' | 'retirement' | 'education'
  | 'vehicle' | 'wedding' | 'vacation' | 'investment'
  | 'debtpayoff' | 'medical' | 'business' | 'custom'
  | 'travel'; // legacy alias

export interface LifeGoal {
  id:                   string;
  category:             GoalCategoryKey;
  name:                 string;
  emoji:                string;
  color:                string;
  targetAmount:         number;
  currentSaved:         number;
  monthlyContrib:       number;
  targetDate:           string;
  homePrice?:           number;
  downPaymentPct?:      number;
  childName?:           string;
  childAge?:            number;
  emergencyMonths?:     3 | 6 | 12;
  notes?:               string;
  createdAt:            string;
  completedAt?:         string;
  fundingStrategy?:     FundingStrategy;
  priority?:            GoalPriority;
  allocatedCash?:       number;
  allocatedInvestment?: number;
  debtRate?:            number;
  debtTermMonths?:      number;
}

export interface TrackAnalysis {
  pct:             number;
  monthsLeft:      number;
  monthlyNeeded:   number;
  projectedMonths: number;
  projectedDate:   Date;
  onTrack:         boolean;
  done:            boolean;
  gapPerMonth:     number;
}

/* ── Category metadata ── */
export const GOAL_CATS: Record<GoalCategoryKey, {
  label: string; emoji: string; defaultColor: string; description: string;
}> = {
  home:       { label: 'Home Purchase',    emoji: '🏠', defaultColor: '#0a3fa8', description: 'Save for your down payment & closing costs' },
  emergency:  { label: 'Emergency Fund',   emoji: '🛡️', defaultColor: '#16A34A', description: '3–6 months of living expenses as a cushion' },
  retirement: { label: 'Early Retirement', emoji: '🏖️', defaultColor: '#7C3AED', description: 'Hit your FI number and retire on your terms' },
  education:  { label: 'Education',        emoji: '🎓', defaultColor: '#0891B2', description: 'College, trade school, or certification fund' },
  vehicle:    { label: 'New Vehicle',      emoji: '🚗', defaultColor: '#D97706', description: 'Save for a car, truck, or motorcycle' },
  wedding:    { label: 'Wedding',          emoji: '💍', defaultColor: '#EC4899', description: 'Wedding, honeymoon, or anniversary fund' },
  vacation:   { label: 'Vacation',         emoji: '✈️', defaultColor: '#0891B2', description: 'Dream vacation or adventure fund' },
  investment: { label: 'Investment',       emoji: '📈', defaultColor: '#7C3AED', description: 'Build a specific investment position or portfolio' },
  debtpayoff: { label: 'Debt Payoff',      emoji: '🔓', defaultColor: '#DC2626', description: 'Pay off a loan, credit card, or other debt' },
  medical:    { label: 'Medical',          emoji: '🏥', defaultColor: '#0891B2', description: 'Healthcare costs, procedures, or HSA funding' },
  business:   { label: 'Business',         emoji: '💼', defaultColor: '#475569', description: 'Start a business or side hustle' },
  custom:     { label: 'Custom Goal',      emoji: '⭐', defaultColor: '#D97706', description: 'Any financial milestone you are working toward' },
  travel:     { label: 'Travel',           emoji: '✈️', defaultColor: '#0891B2', description: 'Dream vacation or adventure fund' }, // legacy
};

export const PRESET_COLORS = [
  '#0a3fa8', '#16A34A', '#DC2626', '#7C3AED',
  '#D97706', '#0891B2', '#EC4899', '#475569',
];

export const GOAL_EMOJIS = [
  '🏠', '🛡️', '🏖️', '🎓', '🚗', '💍', '✈️', '💼', '⭐', '🎯',
  '🏋️', '🌍', '🎵', '👶', '🎄', '🎮', '🏥', '💰', '🌱', '🔑',
];

export const WIZARD_CATS: GoalCategoryKey[] = [
  'home', 'emergency', 'retirement', 'education', 'vehicle', 'wedding',
  'vacation', 'investment', 'debtpayoff', 'medical', 'business', 'custom',
];

/* ── Date helpers ── */
export function monthsUntil(dateStr: string): number {
  const t = new Date(dateStr), now = new Date();
  return Math.max(0, (t.getFullYear() - now.getFullYear()) * 12 + (t.getMonth() - now.getMonth()));
}

export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function fmtShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/* ── Finance math ── */
export function calcMonthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (termMonths <= 0) return 0;
  if (annualRatePct === 0) return principal / termMonths;
  const r = annualRatePct / 100 / 12;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

export function futureValueInvested(amount: number, annualRatePct: number, months: number): number {
  return amount * Math.pow(1 + annualRatePct / 100 / 12, months);
}

/* ── Core tracking math ── */
export function trackAnalysis(goal: LifeGoal): TrackAnalysis {
  const effectiveSaved  = goal.currentSaved + (goal.allocatedCash ?? 0) + (goal.allocatedInvestment ?? 0);
  const pct             = goal.targetAmount > 0 ? Math.min(100, (effectiveSaved / goal.targetAmount) * 100) : 0;
  const done            = effectiveSaved >= goal.targetAmount;
  const monthsLeft      = monthsUntil(goal.targetDate);
  const remaining       = Math.max(0, goal.targetAmount - effectiveSaved);
  const monthlyNeeded   = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  const projectedMonths = goal.monthlyContrib > 0 ? remaining / goal.monthlyContrib : Infinity;
  const projectedDate   = isFinite(projectedMonths) ? addMonths(new Date(), Math.ceil(projectedMonths)) : new Date(2099, 0);
  const onTrack         = done || (goal.monthlyContrib >= monthlyNeeded * 0.95);
  const gapPerMonth     = monthlyNeeded - goal.monthlyContrib;
  return { pct, monthsLeft, monthlyNeeded, projectedMonths: Math.ceil(projectedMonths), projectedDate, onTrack, done, gapPerMonth };
}

/* ── Formatters ── */
export const fmt = (n: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const fmtShort = (n: number): string => {
  const abs = Math.abs(n), s = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${s}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `${s}$${(abs / 1_000).toFixed(0)}K`;
  return `${s}$${Math.round(abs)}`;
};

/* ── DB row mappers (used by API routes) ── */
export function rowToGoal(row: Record<string, unknown>): LifeGoal {
  return {
    id:                   row.id as string,
    category:             row.category as GoalCategoryKey,
    name:                 row.name as string,
    emoji:                row.emoji as string,
    color:                row.color as string,
    targetAmount:         Number(row.target_amount),
    currentSaved:         Number(row.current_saved),
    monthlyContrib:       Number(row.monthly_contrib),
    targetDate:           (row.target_date as string) ?? '',
    notes:                (row.notes as string)               ?? undefined,
    homePrice:            row.home_price         != null ? Number(row.home_price)          : undefined,
    downPaymentPct:       row.down_payment_pct   != null ? Number(row.down_payment_pct)    : undefined,
    childName:            (row.child_name as string)          ?? undefined,
    childAge:             row.child_age          != null ? Number(row.child_age)           : undefined,
    emergencyMonths:      row.emergency_months   != null ? (Number(row.emergency_months) as 3 | 6 | 12) : undefined,
    createdAt:            row.created_at as string,
    completedAt:          (row.completed_at as string)        ?? undefined,
    fundingStrategy:      (row.funding_strategy as FundingStrategy) ?? undefined,
    priority:             (row.priority as GoalPriority)      ?? undefined,
    allocatedCash:        row.allocated_cash     != null ? Number(row.allocated_cash)      : undefined,
    allocatedInvestment:  row.allocated_investment != null ? Number(row.allocated_investment) : undefined,
    debtRate:             row.debt_rate          != null ? Number(row.debt_rate)           : undefined,
    debtTermMonths:       row.debt_term_months   != null ? Number(row.debt_term_months)    : undefined,
  };
}

export function goalToRow(g: LifeGoal, userId: string): Record<string, unknown> {
  return {
    id:                    g.id,
    user_id:               userId,
    category:              g.category,
    name:                  g.name,
    emoji:                 g.emoji,
    color:                 g.color,
    target_amount:         g.targetAmount,
    current_saved:         g.currentSaved,
    monthly_contrib:       g.monthlyContrib,
    target_date:           g.targetDate        || null,
    notes:                 g.notes             ?? null,
    home_price:            g.homePrice         ?? null,
    down_payment_pct:      g.downPaymentPct    ?? null,
    child_name:            g.childName         ?? null,
    child_age:             g.childAge          ?? null,
    emergency_months:      g.emergencyMonths   ?? null,
    created_at:            g.createdAt,
    completed_at:          g.completedAt       ?? null,
    funding_strategy:      g.fundingStrategy   ?? null,
    priority:              g.priority          ?? null,
    allocated_cash:        g.allocatedCash     ?? null,
    allocated_investment:  g.allocatedInvestment ?? null,
    debt_rate:             g.debtRate          ?? null,
    debt_term_months:      g.debtTermMonths    ?? null,
  };
}
