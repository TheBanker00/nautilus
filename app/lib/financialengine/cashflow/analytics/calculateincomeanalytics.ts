import { Transaction }
from '../../../types/transactions';

export type MonthlyIncomeData = {
  month: string;
  income: number;
};

export type IncomeSource = {
  source: string;
  total: number;
  transactionCount: number;
  averageDeposit: number;
  percentOfIncome: number;
};

export type IncomeAnalytics = {
  totalIncome: number;

  averageMonthlyIncome: number;

  highestMonthlyIncome: number;

  lowestMonthlyIncome: number;

  recurringIncome: number;

  investmentIncome: number;

  incomeTransactionCount: number;

  largestIncomeSource: string;

  largestIncomeAmount: number;

  incomeSources: IncomeSource[];

  monthlyIncome: MonthlyIncomeData[];

  incomeVolatility: number;

  averageDepositSize: number;
};

export function calculateIncomeAnalytics(
  transactions: Transaction[]
): IncomeAnalytics {

  // -----------------------------------
  // INCOME TRANSACTIONS (excluding refunds)
  // -----------------------------------
  const incomeTransactions =
    transactions.filter(
      (transaction) =>
        transaction.transaction_type ===
        'Income' &&
        !transaction.is_refund
    );

  // -----------------------------------
  // TOTAL INCOME
  // -----------------------------------
  const totalIncome =
    incomeTransactions.reduce(
      (sum, transaction) =>
        sum +
        Number(transaction.amount || 0),
      0
    );

  // -----------------------------------
  // MONTHLY GROUPING
  // -----------------------------------
  const monthlyMap:
    Record<string, number> = {};

  incomeTransactions.forEach(
    (transaction) => {

      const date = new Date(
        transaction.date
      );

      const monthKey =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;

      monthlyMap[monthKey] =
        (monthlyMap[monthKey] || 0) +
        Number(transaction.amount || 0);
    }
  );

  // -----------------------------------
  // MONTHLY INCOME SERIES
  // -----------------------------------
  const monthlyIncome =
    Object.entries(monthlyMap)

      .map(([month, income]) => ({
        month,
        income,
      }))

      .sort((a, b) =>
        a.month.localeCompare(
          b.month
        )
      );

  // -----------------------------------
  // MONTHLY VALUES
  // -----------------------------------
  const monthlyValues =
    monthlyIncome.map(
      (month) => month.income
    );

  // -----------------------------------
  // TRUE AVERAGE MONTHLY INCOME
  // -----------------------------------
  const averageMonthlyIncome =
    monthlyValues.length > 0
      ? totalIncome /
        monthlyValues.length
      : 0;

  // -----------------------------------
  // HIGH / LOW MONTHS
  // -----------------------------------
  const highestMonthlyIncome =
    monthlyValues.length > 0
      ? Math.max(...monthlyValues)
      : 0;

  const lowestMonthlyIncome =
    monthlyValues.length > 0
      ? Math.min(...monthlyValues)
      : 0;

  // -----------------------------------
  // INCOME SOURCE ANALYTICS
  // -----------------------------------
  const sourceMap:
    Record<
      string,
      {
        total: number;
        transactionCount: number;
      }
    > = {};

  incomeTransactions.forEach(
    (transaction) => {

      const source =
        transaction.merchant ||
        'Unknown';

      if (!sourceMap[source]) {
        sourceMap[source] = {
          total: 0,
          transactionCount: 0,
        };
      }

      sourceMap[source].total +=
        Number(transaction.amount || 0);

      sourceMap[
        source
      ].transactionCount += 1;
    }
  );

  const incomeSources =
    Object.entries(sourceMap)

      .map(([source, values]) => {

        const averageDeposit =
          values.transactionCount > 0
            ? values.total /
              values.transactionCount
            : 0;

        const percentOfIncome =
          totalIncome > 0
            ? Number(
                (
                  (values.total /
                    totalIncome) *
                  100
                ).toFixed(1)
              )
            : 0;

        return {
          source,

          total:
            values.total,

          transactionCount:
            values.transactionCount,

          averageDeposit,

          percentOfIncome,
        };
      })

      .sort(
        (a, b) =>
          b.total - a.total
      );

  // -----------------------------------
  // LARGEST SOURCE
  // -----------------------------------
  const largestIncomeSource =
    incomeSources[0]?.source ||
    'N/A';

  const largestIncomeAmount =
    incomeSources[0]?.total || 0;

  // -----------------------------------
  // RECURRING INCOME
  // -----------------------------------
  const recurringIncome =
    incomeTransactions

      .filter(
        (transaction) =>
          transaction.tags?.includes(
            'recurring'
          )
      )

      .reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

  // -----------------------------------
  // INVESTMENT INCOME
  // -----------------------------------
  const investmentIncome =
    incomeTransactions

      .filter(
        (transaction) =>
          transaction.category ===
          'Investment'
      )

      .reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

  // -----------------------------------
  // AVERAGE DEPOSIT SIZE
  // -----------------------------------
  const averageDepositSize =
    incomeTransactions.length > 0
      ? totalIncome /
        incomeTransactions.length
      : 0;

  // -----------------------------------
  // INCOME VOLATILITY
  // -----------------------------------
  const incomeVolatility =
    highestMonthlyIncome -
    lowestMonthlyIncome;

  return {
    totalIncome,

    averageMonthlyIncome,

    highestMonthlyIncome,

    lowestMonthlyIncome,

    recurringIncome,

    investmentIncome,

    incomeTransactionCount:
      incomeTransactions.length,

    largestIncomeSource,

    largestIncomeAmount,

    incomeSources,

    monthlyIncome,

    incomeVolatility,

    averageDepositSize,
  };
}
