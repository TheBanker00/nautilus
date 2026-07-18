'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { createClient } from './supabase-browser';

/* -----------------------------------
   TYPES
----------------------------------- */
type LiabilityItem = {
  id: string;
  image?: string;
  sourceType: 'plaid' | 'manual';
  amount: number;
  owner: string;
  institution?: string;
  name: string;
  interestRate?: number;
  remainingTerm?: string;
  remainingTermMonths?: number;
  paymentAmount?: number;
};

type AssetItem = {
  id: string;
  sourceType: 'plaid' | 'manual';
  name: string;
  owner: string;
  institution?: string;
  address?: string;
  assetType?: string;
  subtype?: string;
  balance?: number;
  value?: number;
};

export type Snapshot = {
  bankAccounts: AssetItem[];
  investmentAccounts: AssetItem[];
  retirementAccounts: AssetItem[];
  realEstate: AssetItem[];
  otherAssets: AssetItem[];
  liabilities: {
    mortgage: LiabilityItem[];
    creditCard: LiabilityItem[];
    auto: LiabilityItem[];
    studentLoan: LiabilityItem[];
    other: LiabilityItem[];
  };
};

const EMPTY_SNAPSHOT: Snapshot = {
  bankAccounts: [],
  investmentAccounts: [],
  retirementAccounts: [],
  realEstate: [],
  otherAssets: [],
  liabilities: {
    mortgage: [],
    creditCard: [],
    auto: [],
    studentLoan: [],
    other: [],
  },
};

/* -----------------------------------
   CATEGORY → SNAPSHOT KEY MAPPING
   Match these to your account_taxonomy
   category values exactly.
----------------------------------- */
const ASSET_CATEGORY_MAP: Record<string, keyof Omit<Snapshot, 'liabilities'>> = {
  'Cash':         'bankAccounts',
  'Checking':     'bankAccounts',
  'Savings':      'bankAccounts',
  'Investment':   'investmentAccounts',
  'Investments':  'investmentAccounts',
  'Brokerage':    'investmentAccounts',
  'Retirement':   'retirementAccounts',
  '401k':         'retirementAccounts',
  'IRA':          'retirementAccounts',
  'Real Estate':  'realEstate',
  'Other':        'otherAssets',
};

const LIABILITY_CATEGORY_MAP: Record<string, keyof Snapshot['liabilities']> = {
  'Mortgage':       'mortgage',
  'Real Estate':    'mortgage',
  'Credit Card':    'creditCard',
  'Credit Cards':   'creditCard',
  'Auto':           'auto',
  'Auto Loan':      'auto',
  'Auto Loans':     'auto',
  'Student Loan':   'studentLoan',
  'Student Loans':  'studentLoan',
  'Other':          'other',
  'Other Debt':     'other',
};

/* -----------------------------------
   MAP SUPABASE ROW → SNAPSHOT ITEMS
----------------------------------- */
function mapAccountsToSnapshot(rows: any[]): Snapshot {
  const snap: Snapshot = {
    bankAccounts: [],
    investmentAccounts: [],
    retirementAccounts: [],
    realEstate: [],
    otherAssets: [],
    liabilities: {
      mortgage: [],
      creditCard: [],
      auto: [],
      studentLoan: [],
      other: [],
    },
  };

  for (const row of rows) {
    const taxonomy = row.account_taxonomy;
    const networthType = taxonomy?.networth_type;
    const category = (taxonomy?.category ?? 'Other').trim();
    console.log('Row:', row.name, '| type:', row.type, '| subtype:', row.subtype, '| networthType:', networthType, '| category:', category, '| balance:', row.current);
    // liability_details is a 1:1 join returned as an array by Supabase
    const liabilityDetail = Array.isArray(row.liability_details)
      ? (row.liability_details[0] ?? null)
      : (row.liability_details ?? null);

    if (networthType?.toLowerCase() === 'asset') {
      const key = ASSET_CATEGORY_MAP[category] ?? 'otherAssets';
      const isRealEstate = key === 'realEstate';
      const isOther = key === 'otherAssets';

      snap[key].push({
        id: row.account_id,
        sourceType: row.source ?? 'plaid',
        name: row.name,
        owner: row.owner ?? 'Primary',
        institution: row.institution_name ?? undefined,
        address: isRealEstate ? (row.official_name ?? undefined) : undefined,
        assetType: isOther ? (row.subtype ?? undefined) : undefined,
        subtype: row.subtype ?? undefined,
        balance: (!isRealEstate && !isOther) ? (row.current ?? 0) : undefined,
        value: (isRealEstate || isOther) ? (row.current ?? 0) : undefined,
      });
    } else if (networthType?.toLowerCase() === 'liability') {
      const key = LIABILITY_CATEGORY_MAP[category] ?? 'other';

      snap.liabilities[key].push({
        id:           row.account_id,
        sourceType:   row.provider === 'manual' ? 'manual' : 'plaid',
        name:         row.name,
        owner:        row.owner ?? 'Primary',
        institution:  row.institution_name ?? undefined,
        amount:       row.current ?? 0,
        interestRate:        liabilityDetail?.interest_rate ?? undefined,
        remainingTermMonths: liabilityDetail?.remaining_term_months ?? undefined,
        remainingTerm:       liabilityDetail?.remaining_term_months
          ? `${liabilityDetail.remaining_term_months} months`
          : undefined,
        paymentAmount: liabilityDetail?.payment_amount ?? undefined,
      });
    }
  }

  return snap;
}

/* -----------------------------------
   TREND POINT TYPE
----------------------------------- */
export type TrendPoint = {
  label: string;
  monthKey: string;
  assets: number;
  liabilities: number;
  netWorth: number;
};

export type PeriodType = 'month' | 'quarter' | 'year';

/* -----------------------------------
   CONTEXT TYPE
----------------------------------- */
type ContextType = {
  currentSnapshot: Snapshot;
  priorMonthSnapshot: Snapshot | null;
  allSnapshots: Record<string, Snapshot>;
  selectedMonthKey: string;
  setSelectedMonthKey: (value: string) => void;
  availableMonths: string[];
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  trendData: TrendPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  addManualAsset: (asset: {
    name: string;
    category: string;
    balance: number;
    owner?: string;
    institution?: string;
    address?: string;
    assetType?: string;
    type: string;
    subtype: string;
  }) => Promise<void>;
  addManualLiability: (liability: {
    name: string;
    category: string;
    amount: number;
    owner?: string;
    institution?: string;
    interestRate?: number;
    minimumPayment?: number;
    remainingTermMonths?: number;
    type: string;
    subtype: string;
  }) => Promise<void>;
  updateManualLiability: (accountId: string, liability: {
    name: string;
    category: string;
    amount: number;
    owner?: string;
    institution?: string;
    interestRate?: number;
    minimumPayment?: number;
    remainingTermMonths?: number;
    type: string;
    subtype: string;
  }) => Promise<void>;
  deleteManualLiability: (accountId: string) => Promise<void>;
  updateSnapshotForSelectedMonth: (updater: (prev: Snapshot) => Snapshot) => void;
};

/* -----------------------------------
   CONTEXT
----------------------------------- */
export const FinancialContext = createContext<ContextType | undefined>(undefined);

/* -----------------------------------
   PROVIDER
----------------------------------- */
export function FinancialDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [liveSnapshot, setLiveSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [allSnapshots, setAllSnapshots] = useState<Record<string, Snapshot>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve user once on mount and track auth state changes
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[FinancialCtx] getSession uid:', session?.user?.id ?? 'NULL');
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[FinancialCtx] onAuthStateChange', event, 'uid:', session?.user?.id ?? 'NULL');
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  /* -----------------------------------
     FETCH FROM SUPABASE
  ----------------------------------- */
  const fetchAccounts = useCallback(async (uid: string) => {
    const supabase = createClient();
    console.log('[FinancialCtx] fetchAccounts called with uid:', uid);

    setLoading(true);
    setError(null);

    try {
      const [accountsRes, taxonomyRes, snapshotsRes] = await Promise.all([
        supabase
          .from('accounts')
          .select('*, liability_details(*)')
          .eq('user_id', uid)
          .order('name'),
        supabase
          .from('account_taxonomy')
          .select('type, subtype, networth_type, category'),
        supabase
          .from('account_snapshots_monthly')
          .select('account_id, month_key, balance')
          .eq('user_id', uid)
          .order('month_key', { ascending: true }),
      ]);

      console.log('[FinancialCtx] accountsRes:', { count: accountsRes.data?.length, error: accountsRes.error?.message });
      console.log('[FinancialCtx] taxonomyRes:', { count: taxonomyRes.data?.length, error: taxonomyRes.error?.message });
      console.log('[FinancialCtx] snapshotsRes:', { count: snapshotsRes.data?.length, error: snapshotsRes.error?.message });

      if (accountsRes.error) throw accountsRes.error;
      if (taxonomyRes.error) throw taxonomyRes.error;
      // snapshots are optional — don't block account display if the view is inaccessible
      if (snapshotsRes.error) console.warn('[FinancialCtx] snapshots unavailable:', snapshotsRes.error.message);

      // taxonomy lookup map: "type|subtype" → taxonomy row
      const taxonomyMap = new Map(
        (taxonomyRes.data ?? []).map((t) => [
          `${t.type}|${t.subtype}`,
          t,
        ])
      );

      // enrich each account with its taxonomy
      const accounts = (accountsRes.data ?? []).map((account) => ({
        ...account,
        account_taxonomy:
          taxonomyMap.get(`${account.type}|${account.subtype}`) ?? null,
      }));

      // build live snapshot from current account balances
      setLiveSnapshot(mapAccountsToSnapshot(accounts));

      // build historical snapshots aggregated by month (YYYY-MM)
      // group snapshot rows by month, then sum balances per account
      const monthMap: Record<string, Record<string, number>> = {};
      for (const row of snapshotsRes.data ?? []) {
        const monthKey = row.month_key; // already "YYYY-MM" from view
        if (!monthMap[monthKey]) monthMap[monthKey] = {};
        monthMap[monthKey][row.account_id] = Number(row.balance);
      }

      // convert each month into a Snapshot
      const historical: Record<string, Snapshot> = {};
      for (const [monthKey, balances] of Object.entries(monthMap)) {
        const enrichedForMonth = accounts.map((a) => ({
          ...a,
          current: balances[a.account_id] ?? a.current,
        }));
        historical[monthKey] = mapAccountsToSnapshot(enrichedForMonth);
      }

      setAllSnapshots(historical);

      // default selected month to the most recent available
      const months = Object.keys(historical).sort();
      if (months.length > 0) {
        setSelectedMonthKey((prev) => prev || months[months.length - 1]);
      }

    } catch (err: any) {
      setError(err.message ?? 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchAccounts(userId);
  }, [userId, fetchAccounts]);

  /* -----------------------------------
     ADD MANUAL ASSET
  ----------------------------------- */
  const addManualAsset = async (asset: {
    name: string;
    category: string;
    balance: number;
    institution?: string;
    address?: string;
    type: string;
    subtype: string;
  }) => {
    const supabase = createClient();

    const { data: taxRows } = await supabase
      .from('account_taxonomy')
      .select('id')
      .eq('type', asset.type)
      .eq('subtype', asset.subtype)
      .limit(1);
    const taxRow = taxRows?.[0];

    const { error } = await supabase.from('accounts').insert({
      account_id:       crypto.randomUUID(),
      user_id:          userId,
      plaid_item_id:    null,
      taxonomy_id:      taxRow?.id ?? null,
      name:             asset.name,
      official_name:    asset.address ?? null,
      type:             asset.type,
      subtype:          asset.subtype,
      current:          asset.balance,
      institution_name: asset.institution || null,
      provider:         'manual',
    });

    if (error) throw error;
    if (userId) await fetchAccounts(userId);
  };

  /* -----------------------------------
     ADD MANUAL LIABILITY
  ----------------------------------- */
  const addManualLiability = async (liability: {
    name: string;
    category: string;
    amount: number;
    owner?: string;
    institution?: string;
    interestRate?: number;
    minimumPayment?: number;
    remainingTermMonths?: number;
    type: string;
    subtype: string;
  }) => {
    const supabase = createClient();

    // resolve taxonomy_id so the account maps correctly into the snapshot
    const { data: taxRows } = await supabase
      .from('account_taxonomy')
      .select('id')
      .eq('type', liability.type)
      .eq('subtype', liability.subtype)
      .limit(1);
    const taxRow = taxRows?.[0];

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        account_id:       crypto.randomUUID(),
        user_id:          userId,
        plaid_item_id:    null,
        taxonomy_id:      taxRow?.id ?? null,
        name:             liability.name,
        type:             liability.type,
        subtype:          liability.subtype,
        current:          liability.amount,
        institution_name: liability.institution || null,
        provider:         'manual',
      })
      .select('account_id')
      .single();

    if (error) throw error;

    if (
      liability.interestRate !== undefined ||
      liability.minimumPayment !== undefined ||
      liability.remainingTermMonths !== undefined
    ) {
      const { error: detailError } = await supabase.from('liability_details').upsert({
        account_id:            data.account_id,
        user_id:               userId,
        interest_rate:         liability.interestRate ?? null,
        payment_amount:        liability.minimumPayment ?? null,
        remaining_term_months: liability.remainingTermMonths ?? null,
      }, { onConflict: 'account_id' });
      if (detailError) console.error('[addManualLiability] liability_details upsert failed:', detailError);
    }

    if (userId) await fetchAccounts(userId);
  };

  /* -----------------------------------
     UPDATE MANUAL LIABILITY
  ----------------------------------- */
  const updateManualLiability = async (accountId: string, liability: {
    name: string;
    category: string;
    amount: number;
    owner?: string;
    institution?: string;
    interestRate?: number;
    minimumPayment?: number;
    remainingTermMonths?: number;
    type: string;
    subtype: string;
  }) => {
    const supabase = createClient();

    const { data: taxRows } = await supabase
      .from('account_taxonomy')
      .select('id')
      .eq('type', liability.type)
      .eq('subtype', liability.subtype)
      .limit(1);
    const taxRow = taxRows?.[0];

    const { error } = await supabase
      .from('accounts')
      .update({
        taxonomy_id:      taxRow?.id ?? null,
        name:             liability.name,
        type:             liability.type,
        subtype:          liability.subtype,
        current:          liability.amount,
        institution_name: liability.institution || null,
      })
      .eq('account_id', accountId);

    if (error) throw error;

    const { error: detailError } = await supabase.from('liability_details').upsert({
      account_id:            accountId,
      user_id:               userId,
      interest_rate:         liability.interestRate ?? null,
      payment_amount:        liability.minimumPayment ?? null,
      remaining_term_months: liability.remainingTermMonths ?? null,
    }, { onConflict: 'account_id' });
    if (detailError) console.error('[updateManualLiability] liability_details upsert failed:', detailError);

    if (userId) await fetchAccounts(userId);
  };

  /* -----------------------------------
     DELETE MANUAL LIABILITY
  ----------------------------------- */
  const deleteManualLiability = async (accountId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('account_id', accountId)
      .eq('provider', 'manual');
    if (error) throw error;
    if (userId) await fetchAccounts(userId);
  };

  /* -----------------------------------
     SNAPSHOT UPDATE (local override)
  ----------------------------------- */
  const updateSnapshotForSelectedMonth = (
    updater: (prev: Snapshot) => Snapshot
  ) => {
    setAllSnapshots((prev) => ({
      ...prev,
      [selectedMonthKey]: updater(prev[selectedMonthKey] ?? EMPTY_SNAPSHOT),
    }));
  };

  const availableMonths = useMemo(() => Object.keys(allSnapshots).sort(), [allSnapshots]);

  // currentSnapshot: merge historical balances with live detail fields (interest rate,
  // payment, term). Historical snapshots only store balances from account_snapshots_monthly;
  // liability_details fields are live-only and must be overlaid from liveSnapshot.
  const currentSnapshot = useMemo(() => {
    const historical = allSnapshots[selectedMonthKey];
    if (!historical) return liveSnapshot;

    // build a lookup of live liability items by id for detail merging
    const liveById: Record<string, any> = {};
    Object.values(liveSnapshot.liabilities).flat().forEach((item: any) => {
      liveById[item.id] = item;
    });

    const mergeLiabilities = (historicalItems: any[], liveItems: any[]) => {
      const historicalIds = new Set(historicalItems.map((i: any) => i.id));
      const merged = historicalItems.map(item => {
        const live = liveById[item.id] ?? {};
        return {
          ...item,
          // detail fields only exist on live accounts — always overlay from live
          interestRate:        live.interestRate,
          paymentAmount:       live.paymentAmount,
          remainingTerm:       live.remainingTerm,
          remainingTermMonths: live.remainingTermMonths,
          sourceType:          live.sourceType ?? item.sourceType,
        };
      });
      // append manual accounts not in the historical snapshot
      liveItems.forEach(item => {
        if (!historicalIds.has(item.id)) merged.push(item);
      });
      return merged;
    };

    return {
      ...historical,
      liabilities: {
        mortgage:    mergeLiabilities(historical.liabilities.mortgage,    liveSnapshot.liabilities.mortgage),
        creditCard:  mergeLiabilities(historical.liabilities.creditCard,  liveSnapshot.liabilities.creditCard),
        auto:        mergeLiabilities(historical.liabilities.auto,        liveSnapshot.liabilities.auto),
        studentLoan: mergeLiabilities(historical.liabilities.studentLoan, liveSnapshot.liabilities.studentLoan),
        other:       mergeLiabilities(historical.liabilities.other,       liveSnapshot.liabilities.other),
      },
    };
  }, [allSnapshots, selectedMonthKey, liveSnapshot]);

  // priorMonthSnapshot: the period immediately before selected
  const priorMonthSnapshot = useMemo(() => {
    const idx = availableMonths.indexOf(selectedMonthKey);
    return idx > 0 ? allSnapshots[availableMonths[idx - 1]] : null;
  }, [availableMonths, selectedMonthKey, allSnapshots]);

  // helper: sum asset/liability totals from a snapshot
  const snapshotTotals = (snap: Snapshot) => {
    const sumF = (arr: any[], f: string) =>
      arr.reduce((t: number, i: any) => t + Number(i[f] || 0), 0);
    const sumL = (arr: any[]) =>
      arr.reduce((t: number, i: any) => t + (i.amount || 0), 0);
    const assets =
      sumF(snap.bankAccounts, 'balance') +
      sumF(snap.investmentAccounts, 'balance') +
      sumF(snap.retirementAccounts, 'balance') +
      sumF(snap.realEstate, 'value') +
      sumF(snap.otherAssets, 'value');
    const liabilities =
      sumL(snap.liabilities.mortgage) +
      sumL(snap.liabilities.creditCard) +
      sumL(snap.liabilities.auto) +
      sumL(snap.liabilities.studentLoan) +
      sumL(snap.liabilities.other);
    return { assets, liabilities, netWorth: assets - liabilities };
  };

  // trendData: 6 periods up to and including selectedMonthKey, aggregated by periodType
  const trendData = useMemo((): TrendPoint[] => {
    if (!availableMonths.length || !selectedMonthKey) return [];

    if (periodType === 'month') {
      const idx = availableMonths.indexOf(selectedMonthKey);
      const slice = availableMonths.slice(Math.max(0, idx - 5), idx + 1);
      return slice.map((m) => {
        const [y, mo] = m.split('-').map(Number);
        const label = new Date(y, mo - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const totals = snapshotTotals(allSnapshots[m] ?? EMPTY_SNAPSHOT);
        return { label, monthKey: m, ...totals };
      });
    }

    if (periodType === 'quarter') {
      // map each month to its quarter key, keep last month of each quarter
      const quarterMap: Record<string, string> = {};
      for (const m of availableMonths) {
        const [y, mo] = m.split('-').map(Number);
        const q = Math.ceil(mo / 3);
        quarterMap[`${y}-Q${q}`] = m;
      }
      const quarters = Object.keys(quarterMap).sort();
      const [y, mo] = selectedMonthKey.split('-').map(Number);
      const currentQ = `${y}-Q${Math.ceil(mo / 3)}`;
      const idx = quarters.indexOf(currentQ);
      const slice = quarters.slice(Math.max(0, idx - 5), idx + 1);
      return slice.map((qk) => {
        const m = quarterMap[qk];
        const totals = snapshotTotals(allSnapshots[m] ?? EMPTY_SNAPSHOT);
        return { label: qk, monthKey: m, ...totals };
      });
    }

    if (periodType === 'year') {
      // map each month to its year, keep last available month of each year
      const yearMap: Record<string, string> = {};
      for (const m of availableMonths) {
        yearMap[m.substring(0, 4)] = m;
      }
      const years = Object.keys(yearMap).sort();
      const currentYear = selectedMonthKey.substring(0, 4);
      const idx = years.indexOf(currentYear);
      const slice = years.slice(Math.max(0, idx - 5), idx + 1);
      return slice.map((yr) => {
        const m = yearMap[yr];
        const totals = snapshotTotals(allSnapshots[m] ?? EMPTY_SNAPSHOT);
        return { label: yr, monthKey: m, ...totals };
      });
    }

    return [];
  }, [availableMonths, selectedMonthKey, periodType, allSnapshots]);

  return (
    <FinancialContext.Provider
      value={{
        currentSnapshot,
        priorMonthSnapshot,
        allSnapshots,
        selectedMonthKey,
        setSelectedMonthKey,
        availableMonths,
        periodType,
        setPeriodType,
        trendData,
        loading,
        error,
        refetch: () => { if (userId) fetchAccounts(userId); },
        addManualAsset,
        addManualLiability,
        updateManualLiability,
        deleteManualLiability,
        updateSnapshotForSelectedMonth,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

/* -----------------------------------
   HOOK
----------------------------------- */
export function useFinancialData() {
  const ctx = useContext(FinancialContext);

  if (!ctx) {
    throw new Error(
      'useFinancialData must be used within FinancialDataProvider'
    );
  }

  return ctx;
}
