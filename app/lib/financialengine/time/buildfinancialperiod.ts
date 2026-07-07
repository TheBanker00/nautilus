import {
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subMonths,
  subQuarters,
  subYears,
  differenceInCalendarDays,
} from 'date-fns';

import {
  FinancialPeriod,
  FinancialPeriodType,
} from '../../types/financialperiod';

export function buildFinancialPeriod(
  date: Date,
  type: FinancialPeriodType
): FinancialPeriod {

  const now = new Date();

  switch (type) {

    case 'month': {

      const startDate =
        startOfMonth(date);

      const endDate =
        endOfMonth(date);

      const totalDays =
        differenceInCalendarDays(
          endDate,
          startDate
        ) + 1;

      const daysElapsed =
        differenceInCalendarDays(
          now,
          startDate
        ) + 1;

      return {
        id:
          `${date.getFullYear()}-${date.getMonth() + 1}`,

        type,

        label:
          date.toLocaleString(
            'default',
            {
              month: 'long',
              year: 'numeric',
            }
          ),

        startDate,

        endDate,

        previousStartDate:
          startOfMonth(
            subMonths(date, 1)
          ),

        previousEndDate:
          endOfMonth(
            subMonths(date, 1)
          ),

        daysRemaining:
          Math.max(
            0,
            differenceInCalendarDays(
              endDate,
              now
            )
          ),

        totalDays,

        percentComplete:
          Math.min(
            100,
            Math.round(
              (daysElapsed /
                totalDays) *
                100
            )
          ),

        isCurrent:
          now >= startDate &&
          now <= endDate,
      };
    }

    case 'quarter': {

      const startDate =
        startOfQuarter(date);

      const endDate =
        endOfQuarter(date);

      return {
        id:
          `Q${Math.floor(
            date.getMonth() / 3
          ) + 1}-${date.getFullYear()}`,

        type,

        label:
          `Q${Math.floor(
            date.getMonth() / 3
          ) + 1} ${date.getFullYear()}`,

        startDate,

        endDate,

        previousStartDate:
          startOfQuarter(
            subQuarters(date, 1)
          ),

        previousEndDate:
          endOfQuarter(
            subQuarters(date, 1)
          ),

        isCurrent:
          now >= startDate &&
          now <= endDate,
      };
    }

    case 'year': {

      const startDate =
        startOfYear(date);

      const endDate =
        endOfYear(date);

      return {
        id:
          `${date.getFullYear()}`,

        type,

        label:
          `${date.getFullYear()}`,

        startDate,

        endDate,

        previousStartDate:
          startOfYear(
            subYears(date, 1)
          ),

        previousEndDate:
          endOfYear(
            subYears(date, 1)
          ),

        isCurrent:
          now >= startDate &&
          now <= endDate,
      };
    }

    default:

      return buildFinancialPeriod(
        date,
        'month'
      );
  }
}