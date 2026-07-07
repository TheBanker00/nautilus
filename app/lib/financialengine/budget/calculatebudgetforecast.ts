import { Transaction } from '../../types/transactions';
import { AutoBudget } from './calculateautobudgets';

export type BudgetForecast = {
  projectedIncome: number;
  projectedExpenses: number;
  projectedNet: number;
  projectedEndBalance: number;

  recurringObligations: number;
  discretionarySpend: number;

  runwayDays: number;
};

export function calculateBudgetForecast(
  transactions: Transaction[],
  autoBudgets: AutoBudget[],
  currentBalance: number = 0
): BudgetForecast {
  const income = transactions.filter(t => t.transaction_type === 'Income' && !t.is_refund);
  const expense = transactions.filter(t => t.transaction_type === 'Expense');

  const avgIncome =
    income.reduce((sum, t) => sum + Number(t.amount || 0), 0) /
    Math.max(1, new Set(income.map(t => t.date?.slice(0, 7))).size);

  const avgExpenses =
    expense.reduce((sum, t) => sum + Number(t.amount || 0), 0) /
    Math.max(1, new Set(expense.map(t => t.date?.slice(0, 7))).size);

  const recurring = autoBudgets
    .filter(b => b.type === 'subscription' || b.type === 'fixed')
    .reduce((sum, b) => sum + b.recommendedMonthly, 0);

  const discretionary = autoBudgets
    .filter(b => b.type === 'variable')
    .reduce((sum, b) => sum + b.recommendedMonthly, 0);

  const projectedIncome = avgIncome;
  const projectedExpenses = avgExpenses;

  const projectedNet = projectedIncome - projectedExpenses;

  const projectedEndBalance = currentBalance + projectedNet;

  const runwayDays =
    projectedExpenses > 0
      ? (projectedEndBalance / projectedExpenses) * 30
      : 999;

  return {
    projectedIncome,
    projectedExpenses,
    projectedNet,
    projectedEndBalance,
    recurringObligations: recurring,
    discretionarySpend: discretionary,
    runwayDays: Math.max(0, Math.round(runwayDays)),
  };
}
