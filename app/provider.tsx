'use client';

import React from 'react';

import { FinancialDataProvider } from './lib/financialdatacontext';

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinancialDataProvider>
      {children}
    </FinancialDataProvider>
  );
}