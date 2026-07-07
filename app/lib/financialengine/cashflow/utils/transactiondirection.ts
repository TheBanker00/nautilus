import { Transaction } from '../../../types/transactions';

// Plaid's personal_finance_category_detailed codes that represent money
// moving INTO the account when transaction_type is 'Transfer'. Everything
// else under 'Transfer' (TRANSFER_OUT_*, LOAN_PAYMENTS_*, tax payments, cash
// withdrawals) represents money moving OUT.
const INFLOW_TRANSFER_PREFIXES = ['TRANSFER_IN_', 'LOAN_DISBURSEMENTS_'];

// Is this transaction money coming INTO the account? Used to decide the
// +/- sign and color shown in the UI. transaction_type alone isn't enough
// for 'Transfer' rows — a CD deposit and a credit card payment are both
// 'Transfer', but one is an inflow and the other an outflow.
export function isInflow(t: Pick<Transaction, 'transaction_type' | 'provider_subcategory'>): boolean {
  if (t.transaction_type === 'Income') return true;
  if (t.transaction_type === 'Expense') return false;
  if (t.transaction_type === 'Transfer') {
    const code = t.provider_subcategory ?? '';
    return INFLOW_TRANSFER_PREFIXES.some(prefix => code.startsWith(prefix));
  }
  return false;
}
