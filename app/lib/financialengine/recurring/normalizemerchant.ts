/**
 * Fuzzy merchant name normalization.
 * Shared between the detection engine and tag application
 * so both systems group by the same normalized key.
 *
 * "NETFLIX.COM", "NETFLIX*", "NETFLIX INC 12345" → "netflix"
 */
export function normalizeMerchantName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\*.*$/, '')                              // strip everything after *
    .replace(/\.(com|net|org|io|co)(\s|$)/gi, ' ')    // strip .com / .net etc
    .replace(/\s+(inc|llc|ltd|corp|co|plc|dba)\.?\s*$/i, '') // strip legal suffixes
    .replace(/\b\d{4,}\b/g, '')                        // strip long number sequences (merchant IDs)
    .replace(/[^a-z0-9\s]/g, ' ')                      // non-alphanum → space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * From a list of raw merchant name strings, return the one
 * that appears most frequently (used as the display name).
 */
export function getMostCommonName(names: string[]): string {
  const counts: Record<string, number> = {};
  names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? names[0];
}
