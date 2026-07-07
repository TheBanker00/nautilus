import { calcMonthlyPayment, futureValueInvested, monthDiff, addMonths, trackAnalysis, type LifeGoal } from './goals';

export type PurchaseType     = 'cash' | 'finance';
export type PurchaseCategory = 'vehicle' | 'home' | 'renovation' | 'vacation' | 'electronics' | 'education' | 'other';

export const PURCHASE_CATS: Record<PurchaseCategory, { label: string; icon: string; appreciates: boolean }> = {
  vehicle:     { label: 'Vehicle',         icon: '🚗', appreciates: false },
  home:        { label: 'Home / Property', icon: '🏠', appreciates: true  },
  renovation:  { label: 'Renovation',      icon: '🔨', appreciates: true  },
  vacation:    { label: 'Vacation',        icon: '✈️', appreciates: false },
  electronics: { label: 'Electronics',     icon: '💻', appreciates: false },
  education:   { label: 'Education',       icon: '🎓', appreciates: true  },
  other:       { label: 'Other',           icon: '📦', appreciates: false },
};

export interface CashAnalysisInput {
  cost: number;
  category: PurchaseCategory;
  currentCash: number;
  monthlySurplus: number;
  targetDate?: string;
}

export interface CashAnalysisResult {
  type: 'cash';
  cat: typeof PURCHASE_CATS[PurchaseCategory];
  cashNeeded: number;
  canAfford: boolean;
  cashShortage: number;
  monthsToSave: number | null;
  readyDate: Date | null;
  targetMonths: number | null;
  targetFeasible: boolean | null;
  oppCost5yr: number;
  savingsPct: number;
  monthlyNeededForTarget: number;
}

export interface FinanceAnalysisInput {
  cost: number;
  category: PurchaseCategory;
  currentCash: number;
  monthlySurplus: number;
  downPct: number;
  loanRate: number;
  loanTerm: number;
  monthlyTax: number;
  monthlyIns: number;
}

export interface FinanceAnalysisResult {
  type: 'finance';
  cat: typeof PURCHASE_CATS[PurchaseCategory];
  downPayment: number;
  loanAmount: number;
  monthlyPmt: number;
  monthlyPITI: number;
  totalPaid: number;
  totalInterest: number;
  canAffordDown: boolean;
  downShortage: number;
  monthsForDown: number;
  paymentFeasible: boolean;
  oppCostDown5yr: number;
  betterToFinance: boolean;
  hasAddlCosts: boolean;
  savingsPct: number;
  surplusAfter: number;
}

export type PurchaseAnalysisResult = CashAnalysisResult | FinanceAnalysisResult;

export function analyzeCashPurchase(input: CashAnalysisInput): CashAnalysisResult | null {
  const { cost, category, currentCash, monthlySurplus, targetDate } = input;
  if (cost <= 0) return null;
  const cat = PURCHASE_CATS[category];
  const today = new Date();

  const cashNeeded   = cost;
  const cashShortage = Math.max(0, cashNeeded - currentCash);
  const canAfford    = cashShortage === 0;
  const monthsToSave = cashShortage > 0 && monthlySurplus > 0
    ? Math.ceil(cashShortage / monthlySurplus) : cashShortage > 0 ? null : 0;
  const readyDate    = monthsToSave != null ? addMonths(today, monthsToSave) : null;

  let targetMonths: number | null = null, targetFeasible: boolean | null = null;
  if (targetDate) {
    const td = new Date(targetDate);
    targetMonths = Math.max(0, monthDiff(today, td));
    targetFeasible = currentCash + monthlySurplus * targetMonths >= cashNeeded;
  }

  const oppCost5yr = futureValueInvested(cashNeeded, 8, 60) - cashNeeded;

  return {
    type: 'cash', cat, cashNeeded, canAfford, cashShortage,
    monthsToSave, readyDate, targetMonths, targetFeasible, oppCost5yr,
    savingsPct: Math.min(100, currentCash / cashNeeded * 100),
    monthlyNeededForTarget: targetMonths && targetMonths > 0 && cashShortage > 0
      ? Math.ceil(cashShortage / targetMonths) : 0,
  };
}

export function analyzeFinancePurchase(input: FinanceAnalysisInput): FinanceAnalysisResult | null {
  const { cost, category, currentCash, monthlySurplus, downPct, loanRate, loanTerm, monthlyTax, monthlyIns } = input;
  if (cost <= 0) return null;
  const cat = PURCHASE_CATS[category];

  const downPayment    = cost * (downPct / 100);
  const loanAmount     = cost - downPayment;
  const monthlyPmt     = calcMonthlyPayment(loanAmount, loanRate, loanTerm);
  const totalPaid      = downPayment + monthlyPmt * loanTerm;
  const totalInterest  = totalPaid - cost;
  const monthlyPITI    = monthlyPmt + monthlyTax + monthlyIns;
  const canAffordDown  = currentCash >= downPayment;
  const downShortage   = Math.max(0, downPayment - currentCash);
  const monthsForDown  = downShortage > 0 && monthlySurplus > 0 ? Math.ceil(downShortage / monthlySurplus) : 0;
  const paymentFeasible= monthlySurplus >= monthlyPITI;
  const oppCostDown5yr = futureValueInvested(downPayment, 8, 60) - downPayment;
  const betterToFinance= totalInterest < oppCostDown5yr && loanRate < 8;

  return {
    type: 'finance', cat, downPayment, loanAmount, monthlyPmt, monthlyPITI,
    totalPaid, totalInterest, canAffordDown, downShortage, monthsForDown,
    paymentFeasible, oppCostDown5yr, betterToFinance,
    hasAddlCosts: monthlyTax > 0 || monthlyIns > 0,
    savingsPct:   Math.min(100, currentCash / downPayment * 100),
    surplusAfter: monthlySurplus - monthlyPITI,
  };
}

export interface DownPaymentStatus {
  pct: number;
  saved: number;
  needed: number;
  monthsLeft: number | null;
  monthlyNeeded: number | null;
  onTrack: boolean;
  fromGoal: boolean;
}

export function analyzeDownPaymentReadiness(
  analysis: PurchaseAnalysisResult | null,
  linkedGoal: LifeGoal | null,
  currentCash: number,
): DownPaymentStatus | null {
  if (!analysis || analysis.type !== 'finance') return null;
  const needed = analysis.downPayment;

  if (linkedGoal && linkedGoal.targetAmount > 0) {
    const ta = trackAnalysis(linkedGoal);
    return {
      pct: Math.min(100, linkedGoal.currentSaved / needed * 100),
      saved: linkedGoal.currentSaved, needed,
      monthsLeft: ta.monthsLeft, monthlyNeeded: ta.monthlyNeeded, onTrack: ta.onTrack,
      fromGoal: true,
    };
  }

  return {
    pct: Math.min(100, currentCash / needed * 100),
    saved: currentCash, needed, monthsLeft: null, monthlyNeeded: null,
    onTrack: currentCash >= needed, fromGoal: false,
  };
}

export interface BudgetReadiness {
  piti: number;
  remainingAfterPITI: number;
  housingRatio: number;
  totalRatio: number;
  affordable: boolean;
  stretched: boolean;
  strained: boolean;
}

export function analyzeBudgetReadiness(
  analysis: PurchaseAnalysisResult | null,
  avgMonthlyExpenses: number,
  avgMonthlyIncome: number,
): BudgetReadiness | null {
  if (!analysis || analysis.type !== 'finance' || avgMonthlyIncome <= 0) return null;
  const piti               = analysis.monthlyPITI;
  const remainingAfterPITI = avgMonthlyIncome - avgMonthlyExpenses - piti;
  const housingRatio       = (piti / avgMonthlyIncome) * 100;
  const totalObligations   = avgMonthlyExpenses + piti;
  const totalRatio         = (totalObligations / avgMonthlyIncome) * 100;
  return {
    piti, remainingAfterPITI, housingRatio, totalRatio,
    affordable: housingRatio <= 28 && remainingAfterPITI > 0,
    stretched:  housingRatio > 28 && housingRatio <= 36,
    strained:   housingRatio > 36,
  };
}
