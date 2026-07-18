'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { IngestionTransaction } from '../lib/types/ingestiontransaction';
import { fetchTransactions, fetchSplits, TransactionSplit } from '../lib/queries/transactions';

import { applyRecurringTags }              from './financialengine/recurring/applyrecurringtags';
import { calculateRecurringTransactions, RecurringClassification } from './financialengine/cashflow/analytics/calculaterecurringtransactions';
import { analyzeRecurringPatterns }        from './financialengine/recurring/analyzerecurringpatterns';
import { normalizeTransaction }            from './financialengine/normalization/normalizetransactions';

type Transaction = ReturnType<typeof applyRecurringTags>[number];

// -----------------------------------
// CONTEXT TYPE
// -----------------------------------
type TransactionContextType = {
  transactions:      Transaction[];
  recurringPatterns: RecurringClassification[];
  loading:           boolean;
  error:             string | null;
  refresh:           () => void;

  setTransactions: React.Dispatch<React.SetStateAction<IngestionTransaction[]>>;
  addTransaction:    (t: IngestionTransaction) => void;
  updateTransaction: (id: string, updates: Partial<IngestionTransaction>) => void;
  deleteTransaction: (id: string) => void;
};

// -----------------------------------
// CREATE CONTEXT
// -----------------------------------
export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// -----------------------------------
// PROVIDER
// -----------------------------------
export function TransactionProvider({ children }: { children: React.ReactNode }) {

  const [raw,     setRaw]     = useState<IngestionTransaction[]>([]);
  const [splits,  setSplits]  = useState<TransactionSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // -----------------------------------
  // LOAD FROM SUPABASE
  // -----------------------------------
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import('./supabase-browser');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const [txData, splitData] = await Promise.all([
        fetchTransactions(),
        session?.user ? fetchSplits(session.user.id) : Promise.resolve([]),
      ]);

      setSplits(splitData);
      setRaw(txData);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // -----------------------------------
  // NORMALIZATION
  // -----------------------------------
  const splitsByTxId = useMemo(() => {
    const map: Record<string, TransactionSplit[]> = {};
    splits.forEach(s => {
      if (!map[s.transaction_id]) map[s.transaction_id] = [];
      map[s.transaction_id].push(s);
    });
    return map;
  }, [splits]);

  const rawWithSplits = useMemo(() =>
    raw.map(t => splitsByTxId[t.id] ? { ...t, splits: splitsByTxId[t.id] } : t),
    [raw, splitsByTxId]
  );

  const canonicalTransactions = useMemo(() => rawWithSplits.map(normalizeTransaction), [rawWithSplits]);

  // -----------------------------------
  // RECURRING ENGINE
  // -----------------------------------
  const recurringItems = useMemo(
    () => calculateRecurringTransactions(canonicalTransactions),
    [canonicalTransactions]
  );

  const recurringPatterns = useMemo(
    () => analyzeRecurringPatterns(recurringItems),
    [recurringItems]
  );

  // -----------------------------------
  // ENRICH TRANSACTIONS
  // -----------------------------------
  const enrichedTransactions = useMemo(
    () => applyRecurringTags(canonicalTransactions, recurringItems),
    [canonicalTransactions, recurringItems]
  );

  // -----------------------------------
  // CRUD (optimistic — real persistence goes through Supabase separately)
  // -----------------------------------
  const addTransaction = (t: IngestionTransaction) =>
    setRaw(prev => [t, ...prev]);

  const updateTransaction = (id: string, updates: Partial<IngestionTransaction>) =>
    setRaw(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

  const deleteTransaction = (id: string) =>
    setRaw(prev => prev.filter(t => t.id !== id));

  // -----------------------------------
  // MEMOIZED VALUE
  // -----------------------------------
  const value = useMemo(() => ({
    transactions:      enrichedTransactions,
    recurringPatterns,
    loading,
    error,
    refresh:           load,
    setTransactions:   setRaw,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  }), [enrichedTransactions, recurringPatterns, loading, error]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

// -----------------------------------
// CUSTOM HOOK
// -----------------------------------
export function useTransactionData() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactionData must be used within TransactionProvider');
  return context;
}
