export type ExpenseCategory =
  | 'Housing'
  | 'Bills & Utilities'
  | 'Groceries'
  | 'Dining & Restaurants'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Health & Wellness'
  | 'Travel'
  | 'Financial'
  | 'Family & Education'
  | 'Miscellaneous';

  export type IncomeCategory =
  | 'Payroll'
  | 'Investment'
  | 'Business'
  | 'Other';

  export type TransferCategory =
  | 'Transfer In'
  | 'Transfer Out'
  | 'Loan Payment'
  | 'Credit Card Payment'
  | 'Cash Deposit'
  | 'Investment Transfer'
  | 'Cash Withdrawal';

  export type Category =
  | ExpenseCategory
  | IncomeCategory
  | TransferCategory;

