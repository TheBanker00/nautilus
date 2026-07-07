// financialengine/forecast/calculateForecastAnalytics.ts

import { Transaction } from '../../types/transactions';

import { RecurringClassification } from '../cashflow/analytics/calculaterecurringtransactions';

import { calculateForecast } from './calculateforecast';

export function calculateForecastAnalytics(
  transactions: Transaction[],
  recurring: RecurringClassification[],
  startingCash: number
) {
  return calculateForecast(
    transactions,
    recurring,
    startingCash
  );
}
