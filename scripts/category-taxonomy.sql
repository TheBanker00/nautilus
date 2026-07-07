-- ============================================================
--  WealthLens Category Taxonomy
--  Run once in Supabase SQL Editor (Dashboard → SQL Editor)
--  Maps every Plaid personal_finance_category_detailed value
--  to WealthLens transaction_type → category → subcategory
-- ============================================================


-- ── 1. TABLE ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS category_taxonomy (
  provider_subcategory  TEXT PRIMARY KEY,
  transaction_type      TEXT NOT NULL CHECK (transaction_type IN ('Income', 'Expense', 'Transfer')),
  category              TEXT NOT NULL,
  subcategory           TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE category_taxonomy IS
  'Maps Plaid personal_finance_category_detailed codes to WealthLens 3-tier taxonomy.';

COMMENT ON COLUMN category_taxonomy.provider_subcategory IS
  'Exact Plaid personal_finance_category_detailed value (e.g. INCOME_SALARY)';


-- ── 2. INDEXES ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_taxonomy_type     ON category_taxonomy (transaction_type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_category ON category_taxonomy (category);


-- ── 3. SEED DATA ─────────────────────────────────────────────
--  Full mapping of all 129 Plaid subcategories

INSERT INTO category_taxonomy (provider_subcategory, transaction_type, category, subcategory) VALUES

-- INCOME
('INCOME_SALARY',                                             'Income',   'Payroll',            'Salary'),
('INCOME_MILITARY',                                           'Income',   'Payroll',            'Military Pay'),
('INCOME_CONTRACTOR',                                         'Income',   'Business',           'Contractor Income'),
('INCOME_GIG_ECONOMY',                                        'Income',   'Business',           'Gig Work'),
('INCOME_RENTAL',                                             'Income',   'Business',           'Rental Income'),
('INCOME_DIVIDENDS',                                          'Income',   'Investment',         'Dividends'),
('INCOME_INTEREST_EARNED',                                    'Income',   'Investment',         'Interest'),
('INCOME_CHILD_SUPPORT',                                      'Income',   'Other',              'Child Support'),
('INCOME_LONG_TERM_DISABILITY',                               'Income',   'Other',              'Disability Income'),
('INCOME_RETIREMENT_PENSION',                                 'Income',   'Other',              'Pension'),
('INCOME_UNEMPLOYMENT',                                       'Income',   'Other',              'Unemployment Benefits'),
('INCOME_TAX_REFUND',                                         'Income',   'Other',              'Tax Refund'),
('INCOME_OTHER',                                              'Income',   'Other',              'Other Income'),

-- TRANSFERS — Loan Disbursements (money coming in)
('LOAN_DISBURSEMENTS_AUTO',                                   'Transfer', 'Transfer In',        'Auto Loan Disbursement'),
('LOAN_DISBURSEMENTS_CASH_ADVANCES',                          'Transfer', 'Transfer In',        'Cash Advance Disbursement'),
('LOAN_DISBURSEMENTS_EWA',                                    'Transfer', 'Transfer In',        'Earned Wage Access Disbursement'),
('LOAN_DISBURSEMENTS_MORTGAGE',                               'Transfer', 'Transfer In',        'Mortgage Disbursement'),
('LOAN_DISBURSEMENTS_PERSONAL',                               'Transfer', 'Transfer In',        'Personal Loan Disbursement'),
('LOAN_DISBURSEMENTS_STUDENT',                                'Transfer', 'Transfer In',        'Student Loan Disbursement'),
('LOAN_DISBURSEMENTS_OTHER_DISBURSEMENT',                     'Transfer', 'Transfer In',        'Other Loan Disbursement'),

-- TRANSFERS — Loan Payments (money going out)
('LOAN_PAYMENTS_BNPL',                                        'Transfer', 'Loan Payment',       'Buy Now Pay Later Payment'),
('LOAN_PAYMENTS_CASH_ADVANCES',                               'Transfer', 'Loan Payment',       'Cash Advance Payment'),
('LOAN_PAYMENTS_CREDIT_CARD_PAYMENT',                         'Transfer', 'Loan Payment',       'Credit Card Payment'),
('LOAN_PAYMENTS_EWA',                                         'Transfer', 'Loan Payment',       'Earned Wage Access Repayment'),
('LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT',                       'Transfer', 'Loan Payment',       'Personal Loan Payment'),
('LOAN_PAYMENTS_OTHER_PAYMENT',                               'Transfer', 'Loan Payment',       'Other Loan Payment'),

-- TRANSFERS — Transfer In
('TRANSFER_IN_ACCOUNT_TRANSFER',                              'Transfer', 'Transfer In',        'Account Transfer In'),
('TRANSFER_IN_DEPOSIT',                                       'Transfer', 'Cash Deposit',       'Cash Deposit'),
('TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS',               'Transfer', 'Investment Transfer','Investment Transfer In'),
('TRANSFER_IN_SAVINGS',                                       'Transfer', 'Transfer In',        'Savings Transfer In'),
('TRANSFER_IN_TRANSFER_IN_FROM_APPS',                         'Transfer', 'Transfer In',        'App Transfer In'),
('TRANSFER_IN_WIRE',                                          'Transfer', 'Transfer In',        'Incoming Wire'),
('TRANSFER_IN_OTHER_TRANSFER_IN',                             'Transfer', 'Transfer In',        'Other Transfer In'),

-- TRANSFERS — Transfer Out
('TRANSFER_OUT_ACCOUNT_TRANSFER',                             'Transfer', 'Transfer Out',       'Account Transfer Out'),
('TRANSFER_OUT_CRYPTO',                                       'Transfer', 'Investment Transfer','Crypto Transfer Out'),
('TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS',              'Transfer', 'Investment Transfer','Investment Transfer Out'),
('TRANSFER_OUT_SAVINGS',                                      'Transfer', 'Transfer Out',       'Savings Transfer Out'),
('TRANSFER_OUT_TRANSFER_OUT_FROM_APPS',                       'Transfer', 'Transfer Out',       'App Transfer Out'),
('TRANSFER_OUT_WIRE',                                         'Transfer', 'Transfer Out',       'Outgoing Wire'),
('TRANSFER_OUT_WITHDRAWAL',                                   'Transfer', 'Cash Withdrawal',    'Cash Withdrawal'),
('TRANSFER_OUT_OTHER_TRANSFER_OUT',                           'Transfer', 'Transfer Out',       'Other Transfer Out'),

-- TRANSFERS — Government / Tax
('GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT',                     'Transfer', 'Transfer Out',       'Tax Payment'),

-- EXPENSES — Miscellaneous
('OTHER_OTHER',                                               'Expense',  'Miscellaneous',      'Other'),
('GENERAL_MERCHANDISE_TOBACCO_AND_VAPE',                      'Expense',  'Miscellaneous',      'Tobacco & Vape'),
('GOVERNMENT_AND_NON_PROFIT_DONATIONS',                       'Expense',  'Miscellaneous',      'Donations'),
('GENERAL_SERVICES_POSTAGE_AND_SHIPPING',                     'Expense',  'Miscellaneous',      'Postage & Shipping'),
('GENERAL_SERVICES_STORAGE',                                  'Expense',  'Miscellaneous',      'Storage'),
('GENERAL_SERVICES_OTHER_GENERAL_SERVICES',                   'Expense',  'Miscellaneous',      'Other Services'),
('GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT', 'Expense',  'Miscellaneous',      'Other Government/Nonprofit'),

-- EXPENSES — Shopping
('GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS',             'Expense',  'Shopping',           'Books & News'),
('GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES',              'Expense',  'Shopping',           'Clothing & Accessories'),
('GENERAL_MERCHANDISE_CONVENIENCE_STORES',                    'Expense',  'Shopping',           'Convenience Stores'),
('GENERAL_MERCHANDISE_DEPARTMENT_STORES',                     'Expense',  'Shopping',           'Department Stores'),
('GENERAL_MERCHANDISE_DISCOUNT_STORES',                       'Expense',  'Shopping',           'Discount Stores'),
('GENERAL_MERCHANDISE_ELECTRONICS',                           'Expense',  'Shopping',           'Electronics'),
('GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES',                   'Expense',  'Shopping',           'Gifts & Novelties'),
('GENERAL_MERCHANDISE_OFFICE_SUPPLIES',                       'Expense',  'Shopping',           'Office Supplies'),
('GENERAL_MERCHANDISE_ONLINE_MARKETPLACES',                   'Expense',  'Shopping',           'Online Marketplaces'),
('GENERAL_MERCHANDISE_SPORTING_GOODS',                        'Expense',  'Shopping',           'Sporting Goods'),
('GENERAL_MERCHANDISE_SUPERSTORES',                           'Expense',  'Shopping',           'Superstores'),
('GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE',             'Expense',  'Shopping',           'Other Merchandise'),

-- EXPENSES — Entertainment
('ENTERTAINMENT_CASINOS_AND_GAMBLING',                        'Expense',  'Entertainment',      'Gambling'),
('ENTERTAINMENT_MUSIC_AND_AUDIO',                             'Expense',  'Entertainment',      'Music & Audio'),
('ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS', 'Expense',  'Entertainment',      'Events & Attractions'),
('ENTERTAINMENT_TV_AND_MOVIES',                               'Expense',  'Entertainment',      'TV & Movies'),
('ENTERTAINMENT_VIDEO_GAMES',                                 'Expense',  'Entertainment',      'Video Games'),
('ENTERTAINMENT_OTHER_ENTERTAINMENT',                         'Expense',  'Entertainment',      'Other Entertainment'),

-- EXPENSES — Family & Education
('LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT',                        'Expense',  'Family & Education', 'Student Loan Payment'),
('GENERAL_MERCHANDISE_PET_SUPPLIES',                          'Expense',  'Family & Education', 'Pet Supplies'),
('GENERAL_SERVICES_EDUCATION',                                'Expense',  'Family & Education', 'Education Services'),
('GENERAL_SERVICES_CHILDCARE',                                'Expense',  'Family & Education', 'Childcare'),

-- EXPENSES — Health & Wellness
('MEDICAL_DENTAL_CARE',                                       'Expense',  'Health & Wellness',  'Dental Care'),
('MEDICAL_EYE_CARE',                                          'Expense',  'Health & Wellness',  'Eye Care'),
('MEDICAL_NURSING_CARE',                                      'Expense',  'Health & Wellness',  'Nursing Care'),
('MEDICAL_PHARMACIES_AND_SUPPLEMENTS',                        'Expense',  'Health & Wellness',  'Pharmacy & Supplements'),
('MEDICAL_PRIMARY_CARE',                                      'Expense',  'Health & Wellness',  'Primary Care'),
('MEDICAL_VETERINARY_SERVICES',                               'Expense',  'Health & Wellness',  'Veterinary Services'),
('MEDICAL_OTHER_MEDICAL',                                     'Expense',  'Health & Wellness',  'Other Medical'),
('PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS',                    'Expense',  'Health & Wellness',  'Fitness'),
('PERSONAL_CARE_HAIR_AND_BEAUTY',                             'Expense',  'Health & Wellness',  'Hair & Beauty'),
('PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING',                    'Expense',  'Health & Wellness',  'Laundry & Dry Cleaning'),
('PERSONAL_CARE_OTHER_PERSONAL_CARE',                         'Expense',  'Health & Wellness',  'Other Personal Care'),

-- EXPENSES — Financial
('GENERAL_SERVICES_INSURANCE',                                'Expense',  'Financial',          'Insurance'),
('GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING',        'Expense',  'Financial',          'Accounting & Financial Planning'),
('BANK_FEES_ATM_FEES',                                        'Expense',  'Financial',          'ATM Fees'),
('BANK_FEES_INSUFFICIENT_FUNDS',                              'Expense',  'Financial',          'Insufficient Funds Fee'),
('BANK_FEES_INTEREST_CHARGE',                                 'Expense',  'Financial',          'Interest Charge'),
('BANK_FEES_FOREIGN_TRANSACTION_FEES',                        'Expense',  'Financial',          'Foreign Transaction Fee'),
('BANK_FEES_OVERDRAFT_FEES',                                  'Expense',  'Financial',          'Overdraft Fee'),
('BANK_FEES_LATE_FEES',                                       'Expense',  'Financial',          'Late Fee'),
('BANK_FEES_CASH_ADVANCE',                                    'Expense',  'Financial',          'Cash Advance Fee'),
('BANK_FEES_OTHER_BANK_FEES',                                 'Expense',  'Financial',          'Other Bank Fees'),
('GENERAL_SERVICES_CONSULTING_AND_LEGAL',                     'Expense',  'Financial',          'Consulting & Legal'),
('GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES', 'Expense', 'Financial',       'Government Services'),

-- EXPENSES — Transportation
('LOAN_PAYMENTS_CAR_PAYMENT',                                 'Expense',  'Transportation',     'Car Payment'),
('TRANSPORTATION_BIKES_AND_SCOOTERS',                         'Expense',  'Transportation',     'Bikes & Scooters'),
('TRANSPORTATION_GAS',                                        'Expense',  'Transportation',     'Gas'),
('TRANSPORTATION_PARKING',                                    'Expense',  'Transportation',     'Parking'),
('TRANSPORTATION_PUBLIC_TRANSIT',                             'Expense',  'Transportation',     'Transit'),
('TRANSPORTATION_TAXIS_AND_RIDE_SHARES',                      'Expense',  'Transportation',     'Ride Share'),
('TRANSPORTATION_TOLLS',                                      'Expense',  'Transportation',     'Tolls'),
('TRANSPORTATION_OTHER_TRANSPORTATION',                       'Expense',  'Transportation',     'Transportation'),
('GENERAL_SERVICES_AUTOMOTIVE',                               'Expense',  'Transportation',     'Automotive'),

-- EXPENSES — Groceries
('FOOD_AND_DRINK_GROCERIES',                                  'Expense',  'Groceries',          'Groceries'),
('FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR',                       'Expense',  'Groceries',          'Alcohol'),

-- EXPENSES — Bills & Utilities
('RENT_AND_UTILITIES_GAS_AND_ELECTRICITY',                    'Expense',  'Bills & Utilities',  'Gas & Electric'),
('RENT_AND_UTILITIES_INTERNET_AND_CABLE',                     'Expense',  'Bills & Utilities',  'Internet & Cable'),
('RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT',            'Expense',  'Bills & Utilities',  'Waste'),
('RENT_AND_UTILITIES_TELEPHONE',                              'Expense',  'Bills & Utilities',  'Phone'),
('RENT_AND_UTILITIES_WATER',                                  'Expense',  'Bills & Utilities',  'Water'),
('RENT_AND_UTILITIES_OTHER_UTILITIES',                        'Expense',  'Bills & Utilities',  'Utilities'),

-- EXPENSES — Travel
('TRAVEL_FLIGHTS',                                            'Expense',  'Travel',             'Flights'),
('TRAVEL_LODGING',                                            'Expense',  'Travel',             'Lodging'),
('TRAVEL_RENTAL_CARS',                                        'Expense',  'Travel',             'Rental Car'),
('TRAVEL_OTHER_TRAVEL',                                       'Expense',  'Travel',             'Travel'),

-- EXPENSES — Dining & Restaurants
('FOOD_AND_DRINK_COFFEE',                                     'Expense',  'Dining & Restaurants', 'Coffee'),
('FOOD_AND_DRINK_FAST_FOOD',                                  'Expense',  'Dining & Restaurants', 'Fast Food'),
('FOOD_AND_DRINK_RESTAURANT',                                 'Expense',  'Dining & Restaurants', 'Restaurant'),
('FOOD_AND_DRINK_VENDING_MACHINES',                           'Expense',  'Dining & Restaurants', 'Vending'),
('FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK',                       'Expense',  'Dining & Restaurants', 'Food & Drink'),

-- EXPENSES — Housing
('RENT_AND_UTILITIES_RENT',                                   'Expense',  'Housing',            'Rent'),
('HOME_IMPROVEMENT_FURNITURE',                                'Expense',  'Housing',            'Furniture'),
('HOME_IMPROVEMENT_HARDWARE',                                 'Expense',  'Housing',            'Hardware'),
('HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE',                   'Expense',  'Housing',            'Repairs'),
('HOME_IMPROVEMENT_SECURITY',                                 'Expense',  'Housing',            'Security'),
('HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT',                   'Expense',  'Housing',            'Home Improvement'),
('LOAN_PAYMENTS_MORTGAGE_PAYMENT',                            'Expense',  'Housing',            'Mortgage')

ON CONFLICT (provider_subcategory) DO UPDATE SET
  transaction_type = EXCLUDED.transaction_type,
  category         = EXCLUDED.category,
  subcategory      = EXCLUDED.subcategory;


-- ── 4. AUTO-CATEGORIZATION TRIGGER ───────────────────────────
--  Automatically resolves transaction_type, category, subcategory
--  from the plaid_subcategory on every INSERT or UPDATE.
--  Requires your transactions table to have these columns:
--    plaid_subcategory   TEXT   (the raw Plaid value)
--    transaction_type    TEXT
--    category            TEXT
--    subcategory         TEXT

CREATE OR REPLACE FUNCTION fn_apply_category_taxonomy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_row category_taxonomy%ROWTYPE;
BEGIN
  -- Only runs when provider_subcategory is present (Plaid/bank imports).
  -- Manual transactions leave this NULL and set taxonomy columns directly.
  IF NEW.provider_subcategory IS NOT NULL THEN
    SELECT * INTO v_row
    FROM category_taxonomy
    WHERE provider_subcategory = NEW.provider_subcategory;

    IF FOUND THEN
      NEW.transaction_type := v_row.transaction_type;
      NEW.category         := v_row.category;
      NEW.subcategory      := v_row.subcategory;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate so re-running this script is safe
DROP TRIGGER IF EXISTS trg_apply_category_taxonomy ON transactions;

CREATE TRIGGER trg_apply_category_taxonomy
  BEFORE INSERT OR UPDATE OF provider_subcategory
  ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION fn_apply_category_taxonomy();


-- ── 5. BACKFILL existing transactions ────────────────────────
--  Run this once after seeding to categorize historical data.
--  Safe to run multiple times.

UPDATE transactions t
SET
  transaction_type = ct.transaction_type,
  category         = ct.category,
  subcategory      = ct.subcategory
FROM category_taxonomy ct
WHERE t.provider_subcategory = ct.provider_subcategory
  AND (
    t.transaction_type IS NULL OR
    t.category         IS NULL OR
    t.subcategory      IS NULL
  );


-- ── 6. VERIFICATION ──────────────────────────────────────────
--  Run these after executing to confirm everything landed correctly.

-- Should return 129
-- SELECT COUNT(*) FROM category_taxonomy;

-- Should return 0 (no unmapped transactions)
-- SELECT COUNT(*) FROM transactions
-- WHERE plaid_subcategory IS NOT NULL
--   AND transaction_type IS NULL;

-- Distribution by type
-- SELECT transaction_type, COUNT(*) FROM category_taxonomy GROUP BY 1 ORDER BY 1;
