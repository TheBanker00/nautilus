'use client';

import React from 'react';

export default function FinanceCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--t-surface)',
        borderRadius: '18px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--t-card-accent-line)' }} />
      <h2
        style={{
          fontSize: '20px',
          color: 'var(--t-text-primary)',
          marginBottom: '20px',
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}