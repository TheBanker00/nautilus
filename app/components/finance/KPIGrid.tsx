'use client';

import React from 'react';

export default function KPIGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
      }}
    >
      {children}
    </div>
  );
}