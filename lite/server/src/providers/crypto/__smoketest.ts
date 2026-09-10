async function main(): Promise<void> {
  const crypto = await import("./index.ts");
  const tests: Array<[string, () => Promise<void>]> = [
    ["getTopAssets(5)", async () => {
      const assets = await crypto.getTopAssets(5);
      if (assets.length !== 5 || assets.some((asset) => typeof asset.price !== "number" || !asset.sparkline.length)) {
        throw new Error("expected five assets with price and sparkline fields");
      }
    }],
    ["getQuote('BTC')", async () => {
      const quote = await crypto.getQuote("BTC");
      if (quote.symbol !== "BTC" || quote.price <= 0) throw new Error("invalid BTC quote");
    }],
    ["getDominance()", async () => {
      const dominance = await crypto.getDominance();
      if (![dominance.btc, dominance.eth].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) {
        throw new Error("expected BTC and ETH percentages");
      }
    }],
    ["getOHLCV('BTC', '1D')", async () => {
      const candles = await crypto.getOHLCV("BTC", "1D");
      if (!candles.length || candles.some((candle) => ![candle.time, candle.open, candle.high, candle.low, candle.close, candle.volume].every(Number.isFinite))) {
        throw new Error("expected valid Binance candles");
      }
    }],
  ];

  let failed = false;
  for (const [name, test] of tests) {
    try { await test(); console.log(`PASS ${name}`); }
    catch (error) { failed = true; console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  console.log(`\n${failed ? "Some crypto smoke tests failed" : "All crypto smoke tests passed"}`);
  process.exit(failed ? 1 : 0);
}

void main();
