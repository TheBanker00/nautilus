'use client';

type Props = {
  percent: number;
};

export default function BudgetProgressBar({
  percent,
}: Props) {

  const color =
    percent >= 100
      ? '#c0392b'
      : percent >= 80
      ? '#f39c12'
      : '#00A86B';

  return (
    <div
      style={{
        width: '100%',
        height: '10px',
        background: '#edf2f7',
        borderRadius: '999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width:
            `${Math.min(
              percent,
              100
            )}%`,
          height: '100%',
          background: color,
          transition:
            'width 0.3s ease',
        }}
      />
    </div>
  );
}