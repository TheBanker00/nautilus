'use client';

const VARIANT = {
  category: {
    background: '#eef2ff',
    color: '#3730a3',
  },
  subcategory: {
    background: '#f1f5f9',
    color: '#475569',
  },
  recurring: {
    background: '#f0fdf4',
    color: '#15803d',
  },
  pending: {
    background: '#fffbeb',
    color: '#b45309',
  },
} as const;

type Variant = keyof typeof VARIANT;

export default function CategoryPill({
  label,
  variant = 'category',
}: {
  label: string;
  variant?: Variant;
}) {
  const style = VARIANT[variant];
  return (
    <span
      style={{
        ...style,
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
