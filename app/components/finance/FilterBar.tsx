'use client';

import React from 'react';

type Props<T extends string> = {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
};

export default function FilterBar<T extends string>({ options, active, onChange }: Props<T>) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      border: '1px solid rgba(0,0,0,0.12)',
      borderRadius: 9,
      overflow: 'hidden',
      background: 'transparent',
    }}>
      {options.map((option, i) => {
        const isActive = active === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            style={{
              background:    isActive ? 'var(--t-primary)' : 'transparent',
              color:         isActive ? '#ffffff' : 'var(--t-text-tertiary)',
              border:        'none',
              borderLeft:    i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none',
              padding:       '7px 14px',
              cursor:        'pointer',
              fontWeight:    isActive ? 700 : 500,
              fontSize:      13,
              textTransform: 'capitalize',
              transition:    'all 0.15s ease',
              whiteSpace:    'nowrap',
              letterSpacing: isActive ? '.01em' : 'normal',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
