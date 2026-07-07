export type FinancialPeriodType =
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'ytd'
  | 'rolling30'
  | 'rolling90'
  | 'custom';

export type FinancialPeriod = {
  id: string;

  type: FinancialPeriodType;

  label: string;

  startDate: Date;

  endDate: Date;

  previousStartDate?: Date;

  previousEndDate?: Date;

  daysRemaining?: number;

  totalDays?: number;

  percentComplete?: number;

  isCurrent?: boolean;
};