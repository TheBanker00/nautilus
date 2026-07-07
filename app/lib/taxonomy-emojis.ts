import type { ExpenseSubcategory, IncomeSubcategory, TransferSubcategory } from './types/subcategories';
import type { ExpenseCategory, IncomeCategory, TransferCategory } from './types/categories';

// ── Category emojis ──────────────────────────────────────────
export const CATEGORY_EMOJI: Record<string, string> = {
  // Expense categories
  'Housing':              '🏠',
  'Bills & Utilities':    '⚡',
  'Groceries':            '🧺',
  'Dining & Restaurants': '🍽️',
  'Transportation':       '🚗',
  'Shopping':             '🛍️',
  'Entertainment':        '🎬',
  'Health & Wellness':    '💊',
  'Travel':               '✈️',
  'Financial':            '💰',
  'Family & Education':   '📚',
  'Miscellaneous':        '📦',
  // Income categories
  'Income':               '💵',
  'Employment':           '💼',
  'Investment':           '📈',
  'Government':           '🏛️',
  'Other Income':         '💵',
  // Transfer categories
  'Transfer':             '↔️',
  'Loan':                 '🏦',
  'Payment':              '💳',
};

// ── Subcategory emojis ───────────────────────────────────────
export const SUBCATEGORY_EMOJI: Record<ExpenseSubcategory | IncomeSubcategory | TransferSubcategory | string, string> = {
  // ── Income ──
  'Salary':                       '💼',
  'Military Pay':                 '🎖️',
  'Contractor Income':            '🔧',
  'Gig Work':                     '🛵',
  'Rental Income':                '🏘️',
  'Dividends':                    '📈',
  'Interest':                     '🏦',
  'Child Support':                '👨‍👧',
  'Disability Income':            '♿',
  'Pension':                      '🏅',
  'Unemployment Benefits':        '📋',
  'Tax Refund':                   '💸',
  'Other Income':                 '💵',

  // ── Housing ──
  'Rent':                         '🏠',
  'Mortgage':                     '🏡',
  'Furniture':                    '🛋️',
  'Hardware':                     '🔨',
  'Repairs':                      '🔧',
  'Security':                     '🔒',
  'Home Improvement':             '🏗️',

  // ── Bills & Utilities ──
  'Gas & Electric':               '⚡',
  'Internet & Cable':             '📡',
  'Waste':                        '🗑️',
  'Phone':                        '📱',
  'Water':                        '💧',
  'Utilities':                    '🔌',
  'Insurance':                    '🛡️',

  // ── Groceries ──
  'Groceries':                    '🧺',
  'Alcohol':                      '🍷',

  // ── Dining & Restaurants ──
  'Restaurant':                   '🍽️',
  'Fast Food':                    '🍔',
  'Coffee':                       '☕',
  'Vending':                      '🎰',
  'Food & Drink':                 '🥤',

  // ── Transportation ──
  'Car Payment':                  '🚗',
  'Gas':                          '⛽',
  'Parking':                      '🅿️',
  'Transit':                      '🚌',
  'Ride Share':                   '🚕',
  'Tolls':                        '🛣️',
  'Bikes & Scooters':             '🛴',
  'Transportation':               '🚗',
  'Automotive':                   '🔩',

  // ── Shopping ──
  'Clothing & Accessories':       '👗',
  'Electronics':                  '💻',
  'Convenience Stores':           '🏪',
  'Department Stores':            '🏬',
  'Discount Stores':              '🏷️',
  'Online Marketplaces':          '📦',
  'Sporting Goods':               '⚽',
  'Superstores':                  '🛒',
  'Office Supplies':              '✏️',
  'Gifts & Novelties':            '🎁',
  'Books & News':                 '📰',
  'Other Merchandise':            '🛍️',

  // ── Entertainment ──
  'Music & Audio':                '🎵',
  'Events & Attractions':         '🎡',
  'TV & Movies':                  '🎬',
  'Video Games':                  '🎮',
  'Gambling':                     '🎲',
  'Other Entertainment':          '🎭',

  // ── Health & Wellness ──
  'Primary Care':                 '🩺',
  'Dental Care':                  '🦷',
  'Eye Care':                     '👁️',
  'Pharmacy & Supplements':       '💊',
  'Nursing Care':                 '🏥',
  'Veterinary Services':          '🐾',
  'Other Medical':                '🏥',
  'Fitness':                      '🏋️',
  'Hair & Beauty':                '💇',
  'Laundry & Dry Cleaning':       '👔',
  'Other Personal Care':          '🧴',

  // ── Travel ──
  'Flights':                      '✈️',
  'Lodging':                      '🏨',
  'Rental Car':                   '🚙',
  'Travel':                       '🗺️',

  // ── Financial ──
  'Accounting & Financial Planning': '📊',
  'ATM Fees':                     '🏧',
  'Interest Charge':              '📉',
  'Insufficient Funds Fee':       '⚠️',
  'Overdraft Fee':                '⚠️',
  'Late Fee':                     '⏰',
  'Foreign Transaction Fee':      '🌐',
  'Cash Advance Fee':             '💳',
  'Other Bank Fees':              '🏦',
  'Consulting & Legal':           '⚖️',
  'Government Services':          '🏛️',

  // ── Family & Education ──
  'Student Loan Payment':         '🎓',
  'Education Services':           '📚',
  'Childcare':                    '👶',
  'Pet Supplies':                 '🐶',

  // ── Miscellaneous ──
  'Tobacco & Vape':               '🚬',
  'Donations':                    '❤️',
  'Postage & Shipping':           '📮',
  'Storage':                      '📦',
  'Other Services':               '🔧',
  'Other Government/Nonprofit':   '🏛️',
  'Other':                        '📦',

  // ── Transfers ──
  'Credit Card Payment':          '💳',
  'Account Transfer In':          '⬇️',
  'Account Transfer Out':         '⬆️',
  'Savings Transfer In':          '🐷',
  'Savings Transfer Out':         '🐷',
  'Investment Transfer In':       '📈',
  'Investment Transfer Out':      '📈',
  'App Transfer In':              '📲',
  'App Transfer Out':             '📲',
  'Incoming Wire':                '🔌',
  'Outgoing Wire':                '🔌',
  'Cash Deposit':                 '💵',
  'Cash Withdrawal':              '🏧',
  'Cash Advance Disbursement':    '💳',
  'Auto Loan Disbursement':       '🚗',
  'Mortgage Disbursement':        '🏡',
  'Personal Loan Disbursement':   '🏦',
  'Student Loan Disbursement':    '🎓',
  'Earned Wage Access Disbursement': '💸',
  'Other Loan Disbursement':      '🏦',
  'Buy Now Pay Later Payment':    '🛍️',
  'Cash Advance Payment':         '💳',
  'Earned Wage Access Repayment': '💸',
  'Personal Loan Payment':        '🏦',
  'Other Loan Payment':           '🏦',
  'Crypto Transfer Out':          '₿',
  'Tax Payment':                  '🏛️',
  'Other Transfer In':            '↔️',
  'Other Transfer Out':           '↔️',
};

/**
 * Returns the best emoji for a transaction — subcategory first, then
 * category fallback, then a neutral default.
 */
export function getTxEmoji(subcategory?: string | null, category?: string | null): string {
  if (subcategory && SUBCATEGORY_EMOJI[subcategory]) return SUBCATEGORY_EMOJI[subcategory];
  if (category    && CATEGORY_EMOJI[category])    return CATEGORY_EMOJI[category];
  return '📄';
}
