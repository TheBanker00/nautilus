import { MERCHANT_TAXONOMY } from './merchanttaxonomy';

export function matchMerchant(input: string) {
  if (!input) return null;

  const normalized = input.toLowerCase();

  return (
    MERCHANT_TAXONOMY.find(merchant =>
      merchant.aliases.some(alias =>
        normalized.includes(alias)
      )
    ) || null
  );
}