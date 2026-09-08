import type { NasdaqOptionRow } from "./nasdaq.js";

export type OptionRow = {
  strike: number | null;
  lastPrice: number | null;
  bid: number | null;
  ask: number | null;
  volume: number | null;
  openInterest: number | null;
  inTheMoney: boolean;
};

export type OptionsChain = {
  symbol: string;
  underlyingPrice: number | null;
  expirationDates: string[];
  selectedDate: string | null;
  calls: OptionRow[];
  puts: OptionRow[];
};

/**
 * Transform Nasdaq option row to standard format
 */
export function nasdaqRowToStandard(row: NasdaqOptionRow): OptionRow {
  return {
    strike: row.strike,
    lastPrice: row.lastPrice,
    bid: row.bid,
    ask: row.ask,
    volume: row.volume,
    openInterest: row.openInterest,
    inTheMoney: row.inTheMoney,
  };
}

/**
 * Transform Yahoo option row to standard format
 */
export function yahooRowToStandard(row: any): OptionRow {
  return {
    strike: row.strike,
    lastPrice: row.lastPrice,
    bid: row.bid,
    ask: row.ask,
    volume: row.volume,
    openInterest: row.openInterest,
    inTheMoney: row.inTheMoney ?? false,
  };
}
