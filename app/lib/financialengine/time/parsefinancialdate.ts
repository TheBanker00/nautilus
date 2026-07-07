import { Transaction } from '../../types/transactions';

export function parseFinancialDate(
  dateString: string
): Date {

  const [year, month, day] =
    dateString
      .split('T')[0]
      .split('-')
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}