import {
  TRANSFER_KEYWORDS,
} from './merchanttaxonomy';

export function detectTransfer(
  merchant: string
) {

  const normalized =
    merchant.toLowerCase();

  return TRANSFER_KEYWORDS.some(
    keyword =>

      normalized.includes(
        keyword.toLowerCase()
      )

  );
}