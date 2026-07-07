import {
  SUBSCRIPTION_MERCHANTS,
} from './merchanttaxonomy';

export function detectSubscription(
  merchant: string
) {

  const normalized =
    merchant.toLowerCase();

  return SUBSCRIPTION_MERCHANTS.some(
    merchantName =>

      normalized.includes(
        merchantName.toLowerCase()
      )

  );
}