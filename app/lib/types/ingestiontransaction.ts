export type IngestionTransaction = {
  id: string;
  date: string;
  amount: number;
  transaction_type?: 'Income' | 'Expense' | 'Transfer';

  merchant?: string;
  name?: string;

  provider_subcategory?: string;

  accountId?: string;
  accountName?: string;

  institution?: string;
  sourceType?: 'manual' | 'plaid' | 'csv' | 'api';

  pending?: boolean;

  notes?: string;

  logo?: string;

  category?: string;
  subcategory?: string;
  is_manually_categorized?: boolean;
  is_split?: boolean;
  splits?: { id: string; amount: number; category: string; subcategory?: string; note?: string; }[];
  accountSubtype?: string;
};
