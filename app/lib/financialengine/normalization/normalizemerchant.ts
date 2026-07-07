import { MERCHANT_ALIASES }
from './merchantaliases';

/**
 * Words that stay lowercase when they appear mid-name.
 * Always capitalized if they are the first word.
 */
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'for',
  'in', 'on', 'at', 'by', 'to', 'with', '&',
]);

/**
 * Apply smart title case to a merchant display name:
 *   - Words ≤ 4 chars that are already all-uppercase are treated as
 *     abbreviations and left untouched (DTE, ATM, USPS, LLC, AT&T).
 *   - Common filler words (of, the, &, …) stay lowercase mid-name.
 *   - Everything else gets Title Case.
 *
 * Called as the final step on whatever name we resolved — canonical
 * alias or raw fallback — so the UI always sees consistent casing.
 */
export function formatMerchantDisplay(name: string): string {
  if (!name || name === 'Unknown') return name;

  return name
    .split(' ')
    .map((word, i) => {
      if (!word) return word;

      // Preserve abbreviations: short all-caps tokens (DTE, ATM, USPS, LLC, USA)
      // Also handles tokens like "AT&T" which contain non-alpha but are clearly abbreviations
      const letters = word.replace(/[^A-Za-z]/g, '');
      if (letters.length > 0 && letters.length <= 4 && letters === letters.toUpperCase() && /[A-Z]/.test(letters)) {
        return word; // keep exactly as-is
      }

      const lower = word.toLowerCase();

      // Filler words are lowercase unless they're the first word
      if (i > 0 && FILLER_WORDS.has(lower)) return lower;

      // Title case everything else
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function normalizeMerchant(
  merchant?: string,
  fallbackName?: string
): string {

  const raw =
    merchant ||
    fallbackName ||
    'Unknown';

  const cleaned = raw
    .toUpperCase()
    .replace(/[0-9]/g, '')
    .replace(/[^\w\s]/gi, '')
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|co|corporation)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');


  // DIRECT ALIAS MATCH
  for (const alias in MERCHANT_ALIASES) {
    if (cleaned.includes(alias)) {
      return MERCHANT_ALIASES[alias];
    }
  }

  // TITLE CASE FALLBACK
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(word =>
      word.charAt(0).toUpperCase() +
      word.slice(1)
    )
    .join(' ');
}