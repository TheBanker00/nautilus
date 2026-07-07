// ===============================
// FINTECH CORE DATA TYPES
// WealthLens Financial Model
// ===============================

/**
 * A generic financial holding used across:
 * - bank accounts
 * - investment accounts
 * - retirement accounts
 * - real estate
 * - other assets
 */
export type AssetHolding = {
  balance?: number; // liquid/financial accounts
  value?: number;   // non-liquid assets (real estate, etc.)
};

/**
 * Core liabilities structure
 * MUST ALWAYS EXIST (no optional fields in production model)
 */
export type Liabilities = {
  mortgage: number;
  creditCard: number;
  auto: number;
  studentLoan: number;
  other: number;
};

/**
 * A single snapshot of financial data for a time period (month)
 * This is the CORE unit of your dashboard architecture
 */
export type Snapshot = {
  bankAccounts: AssetHolding[];
  investmentAccounts: AssetHolding[];
  retirementAccounts: AssetHolding[];
  realEstate: AssetHolding[];
  otherAssets: AssetHolding[];

  liabilities: Liabilities;
};

/**
 * Time-series collection of snapshots
 * Key = month (e.g. "Jan", "Feb", "2025-01", "Current")
 */
export type AllSnapshots = Record<string, Snapshot>;

/**
 * Context API contract (used in FinancialDataProvider)
 */
export type FinancialContextType = {
  selectedMonthKey: string;
  setSelectedMonthKey: (value: string) => void;

  availableMonths: string[];

  allSnapshots: AllSnapshots;

  currentSnapshot: Snapshot;

  priorMonthSnapshot: Snapshot | null;

  updateSnapshotForSelectedMonth: (
    updater: (prev: Snapshot) => Snapshot
  ) => void;
};