// taxonomy/importtaxonomy.ts

import {
  ExpenseCategory,
  IncomeCategory,
  TransferCategory,
} from '../../types/categories';

import {
  ExpenseSubcategory,
  IncomeSubcategory,
  TransferSubcategory,
} from '../../types/subcategories';

export type CategoryType =
  | 'Income'
  | 'Expense'
  | 'Transfer';

export type ImportTaxonomyEntry = {
  categoryType: CategoryType;
  category:
    | ExpenseCategory
    | IncomeCategory
    | TransferCategory;

  subcategory:
    | ExpenseSubcategory
    | IncomeSubcategory
    | TransferSubcategory;
};

export const IMPORT_TAXONOMY: Record<
  string,
  ImportTaxonomyEntry
> = {

INCOME_SALARY: {
  categoryType: 'Income',
  category: 'Payroll',
  subcategory: 'Salary',
},
// Plaid's real PFC detailed code for paycheck income is INCOME_WAGES (not INCOME_SALARY).
INCOME_WAGES: {
  categoryType: 'Income',
  category: 'Payroll',
  subcategory: 'Salary',
},
// Plaid's real PFC detailed catch-all is INCOME_OTHER_INCOME (not INCOME_OTHER).
INCOME_OTHER_INCOME: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Other Income',
},
INCOME_MILITARY: {
  categoryType: 'Income',
  category: 'Payroll',
  subcategory: 'Military Pay',
},
INCOME_CONTRACTOR: {
  categoryType: 'Income',
  category: 'Business',
  subcategory: 'Contractor Income',
},
INCOME_GIG_ECONOMY: {
  categoryType: 'Income',
  category: 'Business',
  subcategory: 'Gig Work',
},
INCOME_RENTAL: {
  categoryType: 'Income',
  category: 'Business',
  subcategory: 'Rental Income',
},
INCOME_DIVIDENDS: {
  categoryType: 'Income',
  category: 'Investment',
  subcategory: 'Dividends',
},
INCOME_INTEREST_EARNED: {
  categoryType: 'Income',
  category: 'Investment',
  subcategory: 'Interest',
},
INCOME_CHILD_SUPPORT: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Child Support',
},
INCOME_LONG_TERM_DISABILITY: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Disability Income',
},
INCOME_RETIREMENT_PENSION: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Pension',
},
INCOME_UNEMPLOYMENT: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Unemployment Benefits',
},
INCOME_TAX_REFUND: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Tax Refund',
},
INCOME_OTHER: {
  categoryType: 'Income',
  category: 'Other',
  subcategory: 'Other Income',
},

LOAN_DISBURSEMENTS_AUTO: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Auto Loan Disbursement',
},
LOAN_DISBURSEMENTS_CASH_ADVANCES: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Cash Advance Disbursement',
},
LOAN_DISBURSEMENTS_EWA: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Earned Wage Access Disbursement',
},
LOAN_DISBURSEMENTS_MORTGAGE: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Mortgage Disbursement',
},
LOAN_DISBURSEMENTS_PERSONAL: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Personal Loan Disbursement',
},
LOAN_DISBURSEMENTS_STUDENT: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Student Loan Disbursement',
},
LOAN_DISBURSEMENTS_OTHER_DISBURSEMENT: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Other Loan Disbursement',
},

LOAN_PAYMENTS_BNPL: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Buy Now Pay Later Payment',
},
LOAN_PAYMENTS_CASH_ADVANCES: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Cash Advance Payment',
},
LOAN_PAYMENTS_CREDIT_CARD_PAYMENT: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Credit Card Payment',
},
LOAN_PAYMENTS_EWA: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Earned Wage Access Repayment',
},
LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Personal Loan Payment',
},
LOAN_PAYMENTS_OTHER_PAYMENT: {
  categoryType: 'Transfer',
  category: 'Loan Payment',
  subcategory: 'Other Loan Payment',
},

TRANSFER_IN_ACCOUNT_TRANSFER: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Account Transfer In',
},
TRANSFER_IN_DEPOSIT: {
  categoryType: 'Transfer',
  category: 'Cash Deposit',
  subcategory: 'Cash Deposit',
},
TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS: {
  categoryType: 'Transfer',
  category: 'Investment Transfer',
  subcategory: 'Investment Transfer In',
},
TRANSFER_IN_SAVINGS: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Savings Transfer In',
},
TRANSFER_IN_TRANSFER_IN_FROM_APPS: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'App Transfer In',
},
TRANSFER_IN_WIRE: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Incoming Wire',
},
TRANSFER_IN_OTHER_TRANSFER_IN: {
  categoryType: 'Transfer',
  category: 'Transfer In',
  subcategory: 'Other Transfer In',
},

TRANSFER_OUT_ACCOUNT_TRANSFER: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'Account Transfer Out',
},
TRANSFER_OUT_CRYPTO: {
  categoryType: 'Transfer',
  category: 'Investment Transfer',
  subcategory: 'Crypto Transfer Out',
},
TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS: {
  categoryType: 'Transfer',
  category: 'Investment Transfer',
  subcategory: 'Investment Transfer Out',
},
TRANSFER_OUT_SAVINGS: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'Savings Transfer Out',
},
TRANSFER_OUT_TRANSFER_OUT_FROM_APPS: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'App Transfer Out',
},
TRANSFER_OUT_WIRE: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'Outgoing Wire',
},
TRANSFER_OUT_WITHDRAWAL: {
  categoryType: 'Transfer',
  category: 'Cash Withdrawal',
  subcategory: 'Cash Withdrawal',
},
TRANSFER_OUT_OTHER_TRANSFER_OUT: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'Other Transfer Out',
},

GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT: {
  categoryType: 'Transfer',
  category: 'Transfer Out',
  subcategory: 'Tax Payment',
},

OTHER_OTHER: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Other',
},
GENERAL_MERCHANDISE_TOBACCO_AND_VAPE: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Tobacco & Vape',
},
GOVERNMENT_AND_NON_PROFIT_DONATIONS: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Donations',
},
GENERAL_SERVICES_POSTAGE_AND_SHIPPING: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Postage & Shipping',
},
GENERAL_SERVICES_STORAGE: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Storage',
},
GENERAL_SERVICES_OTHER_GENERAL_SERVICES: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Other Services',
},
GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT: {
  categoryType: 'Expense',
  category: 'Miscellaneous',
  subcategory: 'Other Government/Nonprofit',
},

GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Books & News',
},
GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Clothing & Accessories',
},
GENERAL_MERCHANDISE_CONVENIENCE_STORES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Convenience Stores',
},
GENERAL_MERCHANDISE_DEPARTMENT_STORES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Department Stores',
},
GENERAL_MERCHANDISE_DISCOUNT_STORES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Discount Stores',
},
GENERAL_MERCHANDISE_ELECTRONICS: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Electronics',
},
GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Gifts & Novelties',
},
GENERAL_MERCHANDISE_OFFICE_SUPPLIES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Office Supplies',
},
GENERAL_MERCHANDISE_ONLINE_MARKETPLACES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Online Marketplaces',
},
GENERAL_MERCHANDISE_SPORTING_GOODS: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Sporting Goods',
},
GENERAL_MERCHANDISE_SUPERSTORES: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Superstores',
},
GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE: {
  categoryType: 'Expense',
  category: 'Shopping',
  subcategory: 'Other Merchandise',
},

ENTERTAINMENT_CASINOS_AND_GAMBLING: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'Gambling',
},
ENTERTAINMENT_MUSIC_AND_AUDIO: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'Music & Audio',
},
ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'Events & Attractions',
},
ENTERTAINMENT_TV_AND_MOVIES: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'TV & Movies',
},
ENTERTAINMENT_VIDEO_GAMES: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'Video Games',
},
ENTERTAINMENT_OTHER_ENTERTAINMENT: {
  categoryType: 'Expense',
  category: 'Entertainment',
  subcategory: 'Other Entertainment',
},

LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT: {
  categoryType: 'Expense',
  category: 'Family & Education',
  subcategory: 'Student Loan Payment',
},
GENERAL_MERCHANDISE_PET_SUPPLIES: {
  categoryType: 'Expense',
  category: 'Family & Education',
  subcategory: 'Pet Supplies',
},
GENERAL_SERVICES_EDUCATION: {
  categoryType: 'Expense',
  category: 'Family & Education',
  subcategory: 'Education Services',
},
GENERAL_SERVICES_CHILDCARE: {
  categoryType: 'Expense',
  category: 'Family & Education',
  subcategory: 'Childcare',
},

MEDICAL_DENTAL_CARE: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Dental Care',
},
MEDICAL_EYE_CARE: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Eye Care',
},
MEDICAL_NURSING_CARE: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Nursing Care',
},
MEDICAL_PHARMACIES_AND_SUPPLEMENTS: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Pharmacy & Supplements',
},
MEDICAL_PRIMARY_CARE: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Primary Care',
},
MEDICAL_VETERINARY_SERVICES: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Veterinary Services',
},
MEDICAL_OTHER_MEDICAL: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Other Medical',
},
PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Fitness',
},
PERSONAL_CARE_HAIR_AND_BEAUTY: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Hair & Beauty',
},
PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Laundry & Dry Cleaning',
},
PERSONAL_CARE_OTHER_PERSONAL_CARE: {
  categoryType: 'Expense',
  category: 'Health & Wellness',
  subcategory: 'Other Personal Care',
},
GENERAL_SERVICES_INSURANCE: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Insurance',
},

GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Accounting & Financial Planning',
},
BANK_FEES_ATM_FEES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'ATM Fees',
},
BANK_FEES_INSUFFICIENT_FUNDS: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Insufficient Funds Fee',
},
BANK_FEES_INTEREST_CHARGE: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Interest Charge',
},
BANK_FEES_FOREIGN_TRANSACTION_FEES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Foreign Transaction Fee',
},
BANK_FEES_OVERDRAFT_FEES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Overdraft Fee',
},
BANK_FEES_LATE_FEES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Late Fee',
},
BANK_FEES_CASH_ADVANCE: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Cash Advance Fee',
},
BANK_FEES_OTHER_BANK_FEES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Other Bank Fees',
},
GENERAL_SERVICES_CONSULTING_AND_LEGAL: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Consulting & Legal',
},
GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES: {
  categoryType: 'Expense',
  category: 'Financial',
  subcategory: 'Government Services',
},

LOAN_PAYMENTS_CAR_PAYMENT: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Car Payment',
},
TRANSPORTATION_BIKES_AND_SCOOTERS: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Bikes & Scooters',
},
TRANSPORTATION_GAS: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Gas',
},
TRANSPORTATION_PARKING: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Parking',
},
TRANSPORTATION_PUBLIC_TRANSIT: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Transit',
},
TRANSPORTATION_TAXIS_AND_RIDE_SHARES: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Ride Share',
},
TRANSPORTATION_TOLLS: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Tolls',
},
TRANSPORTATION_OTHER_TRANSPORTATION: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Transportation',
},
GENERAL_SERVICES_AUTOMOTIVE: {
  categoryType: 'Expense',
  category: 'Transportation',
  subcategory: 'Automotive',
},

FOOD_AND_DRINK_GROCERIES: {
  categoryType: 'Expense',
  category: 'Groceries',
  subcategory: 'Groceries',
},
FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR: {
  categoryType: 'Expense',
  category: 'Groceries',
  subcategory: 'Alcohol',
},

RENT_AND_UTILITIES_GAS_AND_ELECTRICITY: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Gas & Electric',
},
RENT_AND_UTILITIES_INTERNET_AND_CABLE: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Internet & Cable',
},
RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Waste',
},

RENT_AND_UTILITIES_TELEPHONE: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Phone',
},
RENT_AND_UTILITIES_WATER: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Water',
},

RENT_AND_UTILITIES_OTHER_UTILITIES: {
  categoryType: 'Expense',
  category: 'Bills & Utilities',
  subcategory: 'Utilities',
},

TRAVEL_FLIGHTS: {
  categoryType: 'Expense',
  category: 'Travel',
  subcategory: 'Flights',
},

TRAVEL_LODGING: {
  categoryType: 'Expense',
  category: 'Travel',
  subcategory: 'Lodging',
},

TRAVEL_RENTAL_CARS: {
  categoryType: 'Expense',
  category: 'Travel',
  subcategory: 'Rental Car',
},

TRAVEL_OTHER_TRAVEL: {
  categoryType: 'Expense',
  category: 'Travel',
  subcategory: 'Travel',
},

FOOD_AND_DRINK_COFFEE: {
  categoryType: 'Expense',
  category: 'Dining & Restaurants',
  subcategory: 'Coffee',
},

FOOD_AND_DRINK_FAST_FOOD: {
  categoryType: 'Expense',
  category: 'Dining & Restaurants',
  subcategory: 'Fast Food',
},

FOOD_AND_DRINK_RESTAURANT: {
  categoryType: 'Expense',
  category: 'Dining & Restaurants',
  subcategory: 'Restaurant',
},

FOOD_AND_DRINK_VENDING_MACHINES: {
  categoryType: 'Expense',
  category: 'Dining & Restaurants',
  subcategory: 'Vending',
},

FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK: {
  categoryType: 'Expense',
  category: 'Dining & Restaurants',
  subcategory: 'Food & Drink',
},

RENT_AND_UTILITIES_RENT: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Rent',
},

HOME_IMPROVEMENT_FURNITURE: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Furniture',
},

HOME_IMPROVEMENT_HARDWARE: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Hardware',
},

HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Repairs',
},

HOME_IMPROVEMENT_SECURITY: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Security',
},

HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Home Improvement',
},

LOAN_PAYMENTS_MORTGAGE_PAYMENT: {
  categoryType: 'Expense',
  category: 'Housing',
  subcategory: 'Mortgage',
},

};