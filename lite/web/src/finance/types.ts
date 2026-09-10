// Mirrors the Go backend's JSON responses (openterminal-infra,
// internal/overview + internal/finance). Field names match the `json`
// struct tags there exactly -- keep these two in sync by hand, there's no
// codegen between the two repos.

export type AssetClass = "us_equity" | "india_equity" | "mutual_funds" | "crypto" | "fixed_income" | "cash";

export interface Position {
  class: AssetClass;
  symbol: string;
  label: string;
  account?: string;
  quantity: number;
  currency: string;
  avgCost?: number | null;
  lastPrice?: number | null;
  costINR?: number | null;
  nativeValue: number;
  valueINR: number;
  unrealisedINR?: number | null;
  weight?: number;
  dayPct: number | null;
  dayAbsINR: number;
  live: boolean;
  updatedAt?: string;
}

export interface Sleeve {
  class: AssetClass;
  label: string;
  valueINR: number;
  weight: number;
  dayPct: number | null;
  native: string;
}

export interface Mover {
  symbol: string;
  label: string;
  dayPct: number;
  dayAbsINR: number;
}

export interface Proposal {
  id: number;
  source: string;
  receivedAt: string;
  raw: string;
  parsedJson: string;
  targetSection: string;
  writesJson: string;
  confidence: number;
  status: string;
  decidedAt: string;
  decidedBy: string;
}

export interface Overview {
  netWorthINR: number;
  netWorthUSD: number;
  dayChangeINR: number;
  dayChangePct: number;
  sleeves: Sleeve[];
  movers: Mover[];
  reviewPeek: Proposal[];
}

export interface NetWorthSnapshot {
  id: number;
  snapshotDate: string;
  totalINR: number;
  totalUSD: number;
  breakdownJson: string;
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  us_equity: "US equity",
  india_equity: "Indian equity",
  mutual_funds: "Mutual funds",
  crypto: "Crypto",
  fixed_income: "Fixed income",
  cash: "Cash",
};
