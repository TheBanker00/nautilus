'use client';

import React from 'react';

export default function ChartContainer({
  children,
  height = 340,
}: {
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
      }}
    >
      {children}
    </div>
  );
}