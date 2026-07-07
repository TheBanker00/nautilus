import {
  PAYROLL_KEYWORDS,
} from './merchanttaxonomy';

export function detectPayroll(
  merchant: string
) {

  const normalized =
    merchant.toLowerCase();

  return PAYROLL_KEYWORDS.some(
    keyword =>

      normalized.includes(
        keyword.toLowerCase()
      )

  );
}