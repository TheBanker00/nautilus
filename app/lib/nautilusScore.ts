export const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

export function scoreCashFlow(savingsRate: number): number {
  if (savingsRate >= 0.25) return 98;
  if (savingsRate >= 0.20) return 85 + (savingsRate - 0.20) / 0.05 * 13;
  if (savingsRate >= 0.15) return 70 + (savingsRate - 0.15) / 0.05 * 15;
  if (savingsRate >= 0.10) return 52 + (savingsRate - 0.10) / 0.05 * 18;
  if (savingsRate >= 0.05) return 30 + (savingsRate - 0.05) / 0.05 * 22;
  if (savingsRate >= 0)    return savingsRate / 0.05 * 30;
  return clamp(10 + savingsRate * 50);
}

export function scoreEmergency(months: number): number {
  if (months >= 9) return 100;
  if (months >= 6) return 85 + (months - 6) / 3 * 15;
  if (months >= 3) return 55 + (months - 3) / 3 * 30;
  if (months >= 1) return 22 + (months - 1) / 2 * 33;
  return clamp(months * 22);
}

const FIDELITY_BENCHMARKS: [number, number][] = [
  [25, 0], [30, 1], [35, 2], [40, 3], [45, 4],
  [50, 6], [55, 7], [60, 8], [67, 10],
];

export function scoreRetirement(retBal: number, age: number, annualIncome: number): number {
  if (annualIncome <= 0) return 50;
  let benchmark = 0;
  for (let i = 0; i < FIDELITY_BENCHMARKS.length - 1; i++) {
    const [a0, m0] = FIDELITY_BENCHMARKS[i];
    const [a1, m1] = FIDELITY_BENCHMARKS[i + 1];
    if (age >= a0 && age <= a1) {
      benchmark = m0 + ((age - a0) / (a1 - a0)) * (m1 - m0);
      break;
    }
  }
  if (age < 25) benchmark = 0;
  if (age >= 65) benchmark = 10;
  const target = annualIncome * benchmark;
  if (target <= 0) return 75;
  const ratio = retBal / target;
  if (ratio >= 1.2) return 100;
  if (ratio >= 1.0) return 88 + (ratio - 1.0) / 0.2 * 12;
  if (ratio >= 0.75) return 70 + (ratio - 0.75) / 0.25 * 18;
  if (ratio >= 0.50) return 48 + (ratio - 0.50) / 0.25 * 22;
  if (ratio >= 0.25) return 24 + (ratio - 0.25) / 0.25 * 24;
  return clamp(ratio / 0.25 * 24);
}

export function scoreResilience(cashMonths: number, liabilities: number, annualIncome: number): number {
  const base  = cashMonths >= 6 ? 70 : cashMonths >= 3 ? 48 : cashMonths >= 1 ? 25 : 10;
  const ratio = annualIncome > 0 ? liabilities / annualIncome : 0;
  const bonus = ratio <= 0 ? 30 : ratio <= 1 ? 20 : ratio <= 2 ? 10 : 0;
  return clamp(base + bonus);
}

export function dimensionColor(score: number): string {
  if (score >= 70) return 'var(--t-green)';
  if (score >= 40) return '#7A90B8';
  return 'var(--t-red)';
}
