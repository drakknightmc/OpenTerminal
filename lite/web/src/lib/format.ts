type NumericValue = number | null | undefined;

function isValidNumber(value: NumericValue): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatPrice(num: NumericValue, digits = 2): string {
  if (!isValidNumber(num)) return "--";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function formatNumber(num: NumericValue, maxFractionDigits = 2): string {
  if (!isValidNumber(num)) return "--";
  return num.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
}

export function formatCompact(num: NumericValue): string {
  if (!isValidNumber(num)) return "--";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(num);
}

export function formatPercent(num: NumericValue, digits = 2): string {
  if (!isValidNumber(num)) return "--";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function formatRatio(num: NumericValue, digits = 2): string {
  if (!isValidNumber(num)) return "--";
  return num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatBig(num: NumericValue): string {
  if (!isValidNumber(num)) return "--";

  const absolute = Math.abs(num);
  if (absolute >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (absolute >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function money(value: NumericValue, currency: "INR" | "USD" | string): string {
  if (!isValidNumber(value)) return "--";
  const symbol = currency === "INR" ? "₹" : "$";
  return `${symbol}${formatNumber(value)}`;
}
