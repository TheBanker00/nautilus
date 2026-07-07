'use client';

export default function StickyDateHeader({
  label,
}: {
  label: string;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        background: 'var(--t-bg)',
        margin: '0 -24px',
        padding: '10px 24px',
        zIndex: 10,
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--t-text-tertiary)',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}