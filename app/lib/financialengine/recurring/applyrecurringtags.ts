import { Transaction } from '../../types/transactions';
import { RecurringClassification } from '../cashflow/analytics/calculaterecurringtransactions';
import { normalizeMerchantName } from './normalizemerchant';

export function applyRecurringTags(
  transactions: Transaction[],
  recurringItems: RecurringClassification[]
): Transaction[] {

  // Index by the normalized key so matching is consistent with detection
  const recurringMap = new Map<string, RecurringClassification>();
  recurringItems.forEach(item => {
    const key = item.merchantKey ?? normalizeMerchantName(item.merchant);
    recurringMap.set(key, item);
  });

  return transactions.map(txn => {
    const raw = txn.normalizedMerchant || txn.merchant || '';
    const key = normalizeMerchantName(raw);
    const match = recurringMap.get(key);

    if (!match) return txn;

    // Income and transfer recurring items don't get subscription/bill tags
    if (match.type === 'income' || match.type === 'transfer') return txn;

    // Subscriptions: allow up to 90 days stale (annual subs may skip months)
    // Bills: require isActive
    const daysSinceLast = Math.floor(
      (Date.now() - new Date(match.lastSeenDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (match.type === 'subscription') {
      if (daysSinceLast > 90) return txn;
    } else {
      if (!match.isActive) return txn;
    }

    const tags = new Set(txn.tags || []);
    tags.add('recurring');
    if (match.type === 'subscription') tags.add('subscription');
    if (txn.transaction_type === 'Income') tags.add('recurring-income');

    return {
      ...txn,
      tags:                   Array.from(tags),
      isRecurring:            true,
      isSubscription:         match.type === 'subscription',
      nextExpectedDate:       match.nextExpectedDate ?? undefined,
      recurringFrequency:     match.frequency,
      recurringConfidence:    match.confidence,
      expectedRecurringAmount: match.expectedAmount,
      isRecurringActive:      match.isActive,
    };
  });
}
