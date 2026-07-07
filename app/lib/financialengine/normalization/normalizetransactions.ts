import { IngestionTransaction }
from '../../types/ingestiontransaction';

import { Transaction }
from '../../types/transactions';

import { IMPORT_TAXONOMY }
from '../taxonomy/importtaxonomy';

import { matchMerchant }
from '../taxonomy/merchantlookup';

import { matchKeywords }
from '../taxonomy/keywordlookup';

import { formatMerchantDisplay }
from './normalizemerchant';

/**
 * -------------------------------------
 * REFUND DETECTION
 * -------------------------------------
 */

function detectRefund(
  transaction: IngestionTransaction
): boolean {
  const raw =
    (
      transaction.name ||
      transaction.merchant ||
      ''
    ).toLowerCase();

  return (
    raw.includes('refund') ||
    raw.includes('return') ||
    raw.includes('chargeback') ||
    raw.includes('reversal')
  );
}

/**
 * -------------------------------------
 * TRANSACTION TYPE RESOLUTION
 * -------------------------------------
 */

function resolveTransactionType(
  transaction: IngestionTransaction,
  taxonomy: { categoryType: 'Income' | 'Expense' | 'Transfer' }
): 'Income' | 'Expense' | 'Transfer' {

  const raw =
    (
      transaction.name ||
      transaction.merchant ||
      ''
    ).toLowerCase();

  // Transfer detection via name matching
  if (raw.includes('transfer')) {
    return 'Transfer';
  }

  // Use taxonomy categoryType as primary source
  if (taxonomy.categoryType) {
    // Refunds stay as Expense — is_refund flag handles the distinction
    if (detectRefund(transaction)) {
      return 'Expense';
    }
    return taxonomy.categoryType;
  }

  // Fall back to explicit transaction_type on the ingestion record
  if (transaction.transaction_type) {
    return transaction.transaction_type;
  }

  return 'Expense';
}

/**
 * -------------------------------------
 * NORMALIZATION PIPELINE
 * -------------------------------------
 *
 * IngestionTransaction
 *            ↓
 * Transaction
 *
 * Converts raw Plaid / CSV / Mock data
 * into WealthLens canonical transactions.
 */

export function normalizeTransaction(
  transaction: IngestionTransaction
): Transaction {

  const rawMerchant =
    transaction.merchant ||
    transaction.name ||
    'Unknown';

  /**
   * Merchant Taxonomy
   */
  const merchantMatch =
    matchMerchant(rawMerchant);

  /**
   * Keyword Taxonomy
   */
  const keywordMatch =
    matchKeywords(
      `${rawMerchant} ${transaction.name || ''}`
    );

  /**
   * Base Provider Mapping
   */
  const taxonomy =
    IMPORT_TAXONOMY[
      transaction.provider_subcategory ??
      'UNKNOWN'
    ] ||
    IMPORT_TAXONOMY[
      'OTHER_OTHER'
    ];

  // Normalize sign to WealthLens convention: positive = money in, negative = money out.
  // Plaid uses the opposite convention (positive = money out), so flip for Plaid sources.
  const amount =
    transaction.sourceType === 'plaid'
      ? transaction.amount * -1
      : transaction.amount;

  const transaction_type =
    resolveTransactionType(transaction, taxonomy);

  // A refund is an Expense transaction where money came back in (positive amount)
  // Name-based detection catches edge cases where sign alone isn't reliable
  const is_refund =
    (transaction_type === 'Expense' && amount > 0) ||
    detectRefund(transaction);

  // A reversal is Income that was clawed back (negative amount on an Income transaction)
  const is_reversal =
    transaction_type === 'Income' && amount < 0;

  /**
   * ---------------------------------
   * CATEGORY RESOLUTION
   * ---------------------------------
   * Manual overrides (is_manually_categorized) are preserved as-is.
   * Auto-categorization only runs when the user hasn't set a category.
   */

  let category: string;
  let subcategory: string;

  if (transaction.is_manually_categorized && transaction.category) {
    category    = transaction.category;
    subcategory = transaction.subcategory ?? taxonomy.subcategory;
  } else {
    category    = taxonomy.category;
    subcategory = taxonomy.subcategory;

    if (keywordMatch) {
      if (keywordMatch.category)    category    = keywordMatch.category;
      if (keywordMatch.subcategory) subcategory = keywordMatch.subcategory;
    }

    if (merchantMatch) {
      if (merchantMatch.category)    category    = merchantMatch.category;
      if (merchantMatch.subcategory) subcategory = merchantMatch.subcategory;
    }
  }

  /**
   * ---------------------------------
   * TAGS
   * ---------------------------------
   */

  const tags = new Set<string>();

  if (is_refund) {
    tags.add('refund');
  }

  if (
    transaction_type === 'Transfer'
  ) {
    tags.add('transfer');
  }

  if (
    merchantMatch?.tags
  ) {
    merchantMatch.tags.forEach(
      tag => tags.add(tag)
    );
  }

  if (
    keywordMatch?.tags
  ) {
    keywordMatch.tags.forEach(
      tag => tags.add(tag)
    );
  }

  if (
    merchantMatch?.isSubscription
  ) {
    tags.add('subscription');
  }

  /**
   * ---------------------------------
   * CANONICAL TRANSACTION
   * ---------------------------------
   */

  return {
    id:
      transaction.id,

    date:
      transaction.date,

    amount,

    transaction_type,

    merchant:
      formatMerchantDisplay(merchantMatch?.canonicalName || rawMerchant),

    rawMerchant,

    normalizedMerchant:
      merchantMatch?.canonicalName,

    category,

    subcategory,

    accountId:
      transaction.accountId,

    accountName:
      transaction.accountName,

    institution:
      transaction.institution,

    pending:
      transaction.pending,

    sourceType:
      transaction.sourceType,

    provider_subcategory:
      transaction.provider_subcategory,

    tags:
      Array.from(tags),

    is_refund,

    is_reversal,

    is_manually_categorized:
      transaction.is_manually_categorized ?? false,

    is_split:
      transaction.is_split ?? false,

    splits:
      transaction.splits ?? undefined,

    accountSubtype:
      transaction.accountSubtype ?? undefined,

    notes:
      transaction.notes,

    logo:
      transaction.logo,
  };
}
