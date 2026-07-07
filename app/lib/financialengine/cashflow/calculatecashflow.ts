import { Transaction } from '../../types/transactions';

// Transfer-type categories that represent real cash leaving liquid accounts
// (paying down debt) rather than money moving between the user's own accounts.
export const DEBT_PAYMENT_CATEGORIES = ['Loan Payment', 'Credit Card Payment'];

export type CashFlowMetrics = {
  totalIncome: number;
  totalExpenses: number;
  debtPayments: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  debtPaymentTransactionCount: number;

};

export function calculateCashFlow(
  transactions: Transaction[]
): CashFlowMetrics {
  const incomeTransactions = transactions.filter(
    (t) => t.transaction_type === 'Income' && !t.is_refund
  );

  const expenseTransactions = transactions.filter(
    (t) => t.transaction_type === 'Expense'
  );

  // Debt payments (credit card / loan payments) are categorized as Transfer
  // by Plaid, but they're real cash leaving the account — unlike pure
  // account-to-account transfers (Transfer In/Out, Cash Deposit, Investment
  // Transfer, Cash Withdrawal), which are neutral and stay excluded.
  const debtPaymentTransactions = transactions.filter(
    (t) => t.transaction_type === 'Transfer' && DEBT_PAYMENT_CATEGORIES.includes(t.category)
  );

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const debtPayments = debtPaymentTransactions.reduce(
    (sum, t) => sum + Math.abs(Number(t.amount || 0)),
    0
  );

  const netCashFlow = totalIncome - totalExpenses - debtPayments;

  const transactionCount =
  transactions.length;

  const incomeTransactionCount =
  incomeTransactions.length;

  const expenseTransactionCount =
  expenseTransactions.length;

  const debtPaymentTransactionCount =
  debtPaymentTransactions.length;

  const savingsRate =
    totalIncome > 0
      ? Number(((netCashFlow / totalIncome) * 100).toFixed(1))
      : 0;

  return {
    totalIncome,
    totalExpenses,
    debtPayments,
    netCashFlow,
    savingsRate,
    transactionCount,
    incomeTransactionCount,
    expenseTransactionCount,
    debtPaymentTransactionCount,
  };
}
