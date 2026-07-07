/**
 * merchanttaxonomy.ts
 *
 * PURPOSE:
 * - Canonical merchant identity registry
 * - Used for enrichment (NOT core normalization yet)
 * - Safe to plug into future pipeline without breaking current system
 *
 * IMPORTANT:
 * - Do NOT import this into normalizeTransaction yet
 * - This is a future enrichment layer only
 */
import { Category } from '../../types/categories';
import { Subcategory } from '../../types/subcategories';

export type MerchantTag =
  | 'subscription'
  | 'recurring'
  | 'payroll'
  | 'investment'
  | 'insurance'
  | 'transfer'
  | 'shopping'
  | 'dining'
  | 'refund'
  | 'reimbursement'
  | 'loan'
  | 'mortgage'
  | 'utilities'
  | 'groceries'
  | 'transportation'
  | 'entertainment'
  | 'healthcare'
  | 'education'
  | 'business'
  | 'travel'
  | 'financial-services';

export type MerchantRule = {
  canonicalName: string;
  aliases: string[];

  category?: Category;
  subcategory?: Subcategory;

  tags: MerchantTag[];
  isSubscription?: boolean;
  confidenceBoost?: number;
};

export const MERCHANT_TAXONOMY: MerchantRule[] = [
  {
    canonicalName: 'Netflix',
    aliases: ['netflix', 'netflix.com', 'nflx'],

    category: 'Entertainment',
    subcategory: 'TV & Movies',

    tags: ['subscription', 'entertainment'],
    isSubscription: true,
  },

  {
    canonicalName: 'Spotify',
    aliases: ['spotify', 'spotify premium'],

    category: 'Entertainment',
    subcategory: 'Music & Audio',

    tags: ['subscription', 'entertainment'],
    isSubscription: true,
  },

  {
    canonicalName: 'Amazon',
    aliases: ['amazon', 'amazon.com', 'amzn'],

    category: 'Shopping',
    subcategory: 'Online Marketplaces',

    tags: ['shopping'],
  },

  {
    canonicalName: 'Uber',
    aliases: ['uber', 'uber eats'],

    category: 'Transportation',
    subcategory: 'Ride Share',

    tags: ['transportation'],
  },

  {
    canonicalName: 'Starbucks',
    aliases: ['starbucks'],

    category: 'Dining & Restaurants',
    subcategory: 'Coffee',

    tags: ['dining'],
  }
];