'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  addMonths,
  addQuarters,
  addYears,
  subMonths,
  subQuarters,
  subYears,
} from 'date-fns';

import {
  buildFinancialPeriod,
} from './financialengine/time/buildfinancialperiod';

import {
  FinancialPeriod,
  FinancialPeriodType,
} from './types/financialperiod';

type FinancialPeriodContextType = {
  currentDate: Date;

  currentPeriod: FinancialPeriod;

  periodType: FinancialPeriodType;

  setPeriodType: (
    type: FinancialPeriodType
  ) => void;

  setCurrentDate: (
    date: Date
  ) => void;

  nextPeriod: () => void;

  previousPeriod: () => void;

  goToToday: () => void;

  isCurrentPeriod: boolean;

  comparisonPeriod?: FinancialPeriod;

  enableComparison: boolean;

  setEnableComparison: (
    enabled: boolean
  ) => void;

  comparisonType:
    | 'previous-period'
    | 'previous-year';

  setComparisonType: (
    type:
      | 'previous-period'
      | 'previous-year'
  ) => void;
};

const FinancialPeriodContext =
  createContext<
    FinancialPeriodContextType | undefined
  >(undefined);

export function FinancialPeriodProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  // -----------------------------------
  // CORE STATE
  // -----------------------------------

  const [currentDate, setCurrentDate] =
    useState(new Date());

  const [periodType, setPeriodType] =
    useState<FinancialPeriodType>(
      'month'
    );

  // -----------------------------------
  // COMPARISON STATE
  // -----------------------------------

  const [
    enableComparison,
    setEnableComparison,
  ] = useState(true);

  const [
    comparisonType,
    setComparisonType,
  ] = useState<
    'previous-period' |
    'previous-year'
  >('previous-period');

  // -----------------------------------
  // CURRENT PERIOD
  // -----------------------------------

  const currentPeriod =
    useMemo(() => {

      return buildFinancialPeriod(
        currentDate,
        periodType
      );

    }, [
      currentDate,
      periodType,
    ]);

  // -----------------------------------
  // COMPARISON PERIOD
  // -----------------------------------

  const comparisonPeriod =
    useMemo(() => {

      if (!enableComparison)
        return undefined;

      let comparisonDate =
        currentDate;

      // -----------------------------
      // PREVIOUS PERIOD
      // -----------------------------

      if (
        comparisonType ===
        'previous-period'
      ) {

        switch (periodType) {

          case 'month':
            comparisonDate =
              subMonths(
                currentDate,
                1
              );
            break;

          case 'quarter':
            comparisonDate =
              subQuarters(
                currentDate,
                1
              );
            break;

          case 'year':
            comparisonDate =
              subYears(
                currentDate,
                1
              );
            break;

          default:
            comparisonDate =
              subMonths(
                currentDate,
                1
              );
        }
      }

      // -----------------------------
      // PREVIOUS YEAR
      // -----------------------------

      if (
        comparisonType ===
        'previous-year'
      ) {

        comparisonDate =
          subYears(
            currentDate,
            1
          );
      }

      return buildFinancialPeriod(
        comparisonDate,
        periodType
      );

    }, [
      enableComparison,
      comparisonType,
      currentDate,
      periodType,
    ]);

  // -----------------------------------
  // PERIOD NAVIGATION
  // -----------------------------------

  function nextPeriod() {

    switch (periodType) {

      case 'month':

        setCurrentDate(
          addMonths(
            currentDate,
            1
          )
        );

        break;

      case 'quarter':

        setCurrentDate(
          addQuarters(
            currentDate,
            1
          )
        );

        break;

      case 'year':

        setCurrentDate(
          addYears(
            currentDate,
            1
          )
        );

        break;

      default:

        setCurrentDate(
          addMonths(
            currentDate,
            1
          )
        );
    }
  }

  function previousPeriod() {

    switch (periodType) {

      case 'month':

        setCurrentDate(
          subMonths(
            currentDate,
            1
          )
        );

        break;

      case 'quarter':

        setCurrentDate(
          subQuarters(
            currentDate,
            1
          )
        );

        break;

      case 'year':

        setCurrentDate(
          subYears(
            currentDate,
            1
          )
        );

        break;

      default:

        setCurrentDate(
          subMonths(
            currentDate,
            1
          )
        );
    }
  }

  // -----------------------------------
  // TODAY RESET
  // -----------------------------------

  function goToToday() {

    setCurrentDate(
      new Date()
    );
  }

  // -----------------------------------
  // CURRENT PERIOD CHECK
  // -----------------------------------

  const isCurrentPeriod =
    useMemo(() => {

      return Boolean(
        currentPeriod.isCurrent
      );

    }, [currentPeriod]);

  // -----------------------------------
  // CONTEXT VALUE
  // -----------------------------------

  const value:
    FinancialPeriodContextType = {

    currentDate,

    currentPeriod,

    periodType,

    setPeriodType,

    setCurrentDate,

    nextPeriod,

    previousPeriod,

    goToToday,

    isCurrentPeriod,

    comparisonPeriod,

    enableComparison,

    setEnableComparison,

    comparisonType,

    setComparisonType,
  };

  return (
    <FinancialPeriodContext.Provider
      value={value}
    >
      {children}
    </FinancialPeriodContext.Provider>
  );
}

// -----------------------------------
// HOOK
// -----------------------------------

export function useFinancialPeriod() {

  const context =
    useContext(
      FinancialPeriodContext
    );

  if (!context) {

    throw new Error(
      'useFinancialPeriod must be used within FinancialPeriodProvider'
    );
  }

  return context;
}