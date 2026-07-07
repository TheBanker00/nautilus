import { Transaction } from '../../types/transactions';

export type IncomeCategory =
  | 'Employment'
  | 'Interest'
  | 'Dividends'
  | 'Investment'
  | 'Business'
  | 'Rental'
  | 'Government'
  | 'Other';

export function normalizeIncomeCategory(
  transaction: Transaction
): IncomeCategory {

  const merchant =
    (transaction.merchant || '')
      .toLowerCase();

  const name =
    (transaction.name || '')
      .toLowerCase();

  const searchText =
    `${merchant} ${name}`;

  /* --------------------------
     EMPLOYMENT
  -------------------------- */

  if (
    [
      'payroll',
      'adp',
      'paychex',
      'workday',
      'salary',
      'wages',
      'direct deposit',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Employment';
  }

  /* --------------------------
     INTEREST
  -------------------------- */

  if (
    [
      'interest payment',
      'interest earned',
      'savings interest',
      'money market interest',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Interest';
  }

  /* --------------------------
     DIVIDENDS
  -------------------------- */

  if (
    [
      'dividend',
      'qualified dividend',
      'ordinary dividend',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Dividends';
  }

  /* --------------------------
     INVESTMENT
  -------------------------- */

  if (
    [
      'brokerage',
      'fidelity',
      'schwab',
      'vanguard',
      'etrade',
      'investment',
      'capital gains',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Investment';
  }

  /* --------------------------
     RENTAL
  -------------------------- */

  if (
    [
      'rent payment',
      'tenant payment',
      'rental income',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Rental';
  }

  /* --------------------------
     GOVERNMENT
  -------------------------- */

  if (
    [
      'social security',
      'irs refund',
      'tax refund',
      'state refund',
      'unemployment',
      'benefits',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Government';
  }

  /* --------------------------
     BUSINESS
  -------------------------- */

  if (
    [
      'stripe',
      'square',
      'shopify',
      'paypal',
      'business deposit',
      'client payment',
    ].some(x =>
      searchText.includes(x)
    )
  ) {
    return 'Business';
  }

  return 'Other';
}