/**
 * Currency formatting — single source of truth.
 *
 * All monetary display goes through these helpers so we never have ₱-symbol
 * drift between screens.
 */

export function formatPHP(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    return formatPHPCompact(amount);
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPHPWhole(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPHPCompact(amount: number): string {
  // Manual compaction to match Philippine real-estate convention (₱8.5M, ₱965K)
  const sign = amount < 0 ? "-" : "";
  const v = Math.abs(amount);
  if (v >= 1_000_000_000) {
    return `${sign}₱${(v / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (v >= 1_000_000) {
    return `${sign}₱${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (v >= 1_000) {
    return `${sign}₱${(v / 1_000).toFixed(0)}K`;
  }
  return `${sign}₱${v.toFixed(0)}`;
}

export function formatPercent(decimal: number, digits = 1): string {
  return `${(decimal * 100).toFixed(digits)}%`;
}
