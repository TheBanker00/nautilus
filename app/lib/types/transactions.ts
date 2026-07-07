import {
  ExpenseCategory,
  IncomeCategory,
  TransferCategory,
} from './categories';

import {
  ExpenseSubcategory,
  IncomeSubcategory,
  TransferSubcategory,
} from './subcategories';

/**
 * 🧠 FINAL CANONICAL TRANSACTION MODEL
 *
 * This is the single source of truth for ALL downstream systems:
 * - cashflow
 * - recurring detection
 * - analytics
 * - UI filtering
 */
export type Transaction = {
  /**
   * ---------------------------
   * CORE IDENTITY
   * ---------------------------
   */
  id: string;

  date: string; // ISO date string

  amount: number; // ALWAYS absolute value after normalization

  transaction_type: 'Income' | 'Expense' | 'Transfer';

  /**
   * ---------------------------
   * MERCHANT LAYER
   * ---------------------------
   */
  merchant: string; // canonical display merchant

  rawMerchant: string; // original Plaid/mock value

  normalizedMerchant?: string;

  name?: string;

  /**
   * ---------------------------
   * CLASSIFICATION LAYER
   * ---------------------------
   */
  category: ExpenseCategory | IncomeCategory | TransferCategory;

  subcategory: ExpenseSubcategory | IncomeSubcategory | TransferSubcategory;

  /**
   * ---------------------------
   * ACCOUNT CONTEXT
   * ---------------------------
   */
  accountId?: string;

  accountName?: string;

  institution?: string;

  /**
   * ---------------------------
   * SOURCE METADATA
   * ---------------------------
   */
  sourceType?: 'manual' | 'plaid' | 'csv' | 'api';

  pending?: boolean;

  /**
   * ---------------------------
   * ENRICHMENT FLAGS
   * ---------------------------
   */
  tags?: string[];

  is_refund: boolean;

  is_reversal: boolean;

  is_manually_categorized?: boolean;

  is_split?: boolean;

  splits?: { id: string; amount: number; category: string; subcategory?: string; note?: string; }[];
  accountSubtype?: string;

  /**
   * ---------------------------
   * PROVIDER METADATA
   * ---------------------------
   */
  provider_subcategory?: string;

  linked_transaction_id?: string;

  /**
   * ---------------------------
   * RECURRENCE LAYER (derived)
   * ---------------------------
   */
  isRecurring?: boolean;

  isSubscription?: boolean;

  recurringId?: string;

  nextExpectedDate?: string;

recurringFrequency?:
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'irregular';

recurringConfidence?: number;

expectedRecurringAmount?: number;

isRecurringActive?: boolean;

  /**
   * ---------------------------
   * OPTIONAL UI ENRICHMENT
   * ---------------------------
   */
  logo?: string;

  notes?: string;
};
