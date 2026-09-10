import { Database } from "bun:sqlite";
import { Holding, Currency, getHoldings } from "./store.js";
import { getExternalHoldings } from "./externalDb.js";

export type FxConvert = (amount: number, from: Currency, to: Currency) => Promise<number>;

export interface HoldingWithValue extends Holding {
  nativeValue: number; // quantity * price_of_last_transaction (or avg_cost for unrealized)
  convertedValue: number; // value in the OTHER currency from native
  unrealizedPnl: number; // (current_price - avg_cost) * quantity (using last price as "current")
  unrealizedPnlPercent: number; // unrealizedPnl / (avg_cost * quantity)
}

export interface MarketSummary {
  market: string;
  source: string;
  sourceLabel: string;
  nativeCurrency: Currency;
  nativeTotal: number; // sum of holdings in native currency for this market
  inrValue: number; // total converted to INR
  usdValue: number; // total converted to USD
  holdingCount: number;
}

export interface NetWorthSummary {
  totalInr: number;
  totalUsd: number;
  byMarket: MarketSummary[];
  holdings: HoldingWithValue[];
  computedAt: string;
}

/**
 * Compute net worth across all markets in both INR and USD.
 * Each holding is stored in its native currency.
 * Net worth totals include FX-converted values.
 */
export async function computeNetWorth(
  db: Database,
  fxConvert: FxConvert
): Promise<NetWorthSummary> {
  const holdings = [...getHoldings(db), ...getExternalHoldings()];

  // Get the last transaction price for each holding (for unrealized P&L calculation)
  const lastPrices: Record<number, number> = {};
  for (const holding of holdings) {
    if (holding.last_price != null) {
      lastPrices[holding.id] = holding.last_price;
      continue;
    }
    const lastTx = db
      .prepare(`SELECT price FROM transactions WHERE holding_id = ? ORDER BY date DESC, id DESC LIMIT 1`)
      .get(holding.id) as { price: number } | undefined;
    lastPrices[holding.id] = lastTx?.price || holding.avg_cost;
  }

  // Compute holdings with values
  const holdingsWithValue: HoldingWithValue[] = await Promise.all(
    holdings.map(async (h) => {
      const nativeValue = h.market_value ?? h.quantity * lastPrices[h.id];
      const lastPrice = lastPrices[h.id];
      const unrealizedPnl = (lastPrice - h.avg_cost) * h.quantity;
      const unrealizedPnlPercent =
        h.avg_cost > 0 ? unrealizedPnl / (h.avg_cost * h.quantity) : 0;

      // Convert to the OTHER currency
      const otherCurrency = h.currency === "USD" ? "INR" : "USD";
      const convertedValue = await fxConvert(nativeValue, h.currency, otherCurrency);

      return {
        ...h,
        nativeValue,
        convertedValue,
        unrealizedPnl,
        unrealizedPnlPercent,
      };
    })
  );

  // Group by market
  const marketMap = new Map<
     string,
     { market: string; source: string; sourceLabel: string; nativeCurrency: Currency; nativeTotal: number; inrValue: number; usdValue: number; count: number }
  >();

  for (const h of holdingsWithValue) {
    const source = h.source ?? "manual";
    const sourceLabel = h.sourceLabel ?? "Manual";
    const groupKey = `${source}:${h.market}`;
    if (!marketMap.has(groupKey)) {
      marketMap.set(groupKey, {
        market: h.market,
        source,
        sourceLabel,
        nativeCurrency: h.currency,
        nativeTotal: 0,
        inrValue: 0,
        usdValue: 0,
        count: 0,
      });
    }

    const summary = marketMap.get(groupKey)!;
    summary.nativeTotal += h.nativeValue;
    summary.count += 1;

    if (h.currency === "INR") {
      summary.inrValue += h.nativeValue;
      summary.usdValue += h.convertedValue;
    } else {
      summary.usdValue += h.nativeValue;
      summary.inrValue += h.convertedValue;
    }
  }

  // Convert all market summaries to have both INR and USD values (in case of mixed currencies per market)
  const byMarket: MarketSummary[] = await Promise.all(
    Array.from(marketMap.entries()).map(async ([market, summary]) => {
      // Ensure we have both currency values
      const inrValue =
        summary.nativeCurrency === "INR"
          ? summary.nativeTotal
          : await fxConvert(summary.nativeTotal, "USD", "INR");
      const usdValue =
        summary.nativeCurrency === "USD"
          ? summary.nativeTotal
          : await fxConvert(summary.nativeTotal, "INR", "USD");

      return {
        market: summary.market,
        source: summary.source,
        sourceLabel: summary.sourceLabel,
        nativeCurrency: summary.nativeCurrency,
        nativeTotal: summary.nativeTotal,
        inrValue,
        usdValue,
        holdingCount: summary.count,
      };
    })
  );

  // Compute total net worth
  let totalInr = 0;
  let totalUsd = 0;

  for (const summary of byMarket) {
    totalInr += summary.inrValue;
    totalUsd += summary.usdValue;
  }

  return {
    totalInr,
    totalUsd,
    byMarket,
    holdings: holdingsWithValue,
    computedAt: new Date().toISOString(),
  };
}
