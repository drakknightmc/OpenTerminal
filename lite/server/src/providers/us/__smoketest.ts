import * as us from "./index.js";

const SYMBOL = "AAPL";

async function test(name: string, fn: () => Promise<any>) {
  try {
    console.log(`[TEST] ${name}...`);
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`  ✓ PASS (${ms}ms)`, result);
    return true;
  } catch (err) {
    console.log(`  ✗ FAIL: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  console.log("=== US Equities Provider Smoke Test ===\n");

  const results: Record<string, boolean> = {};

  results.getQuote = await test("getQuote(AAPL)", () => us.getQuote(SYMBOL));
  results.getHistoricalCandles = await test("getHistoricalCandles(AAPL, 6M)", () => us.getHistoricalCandles(SYMBOL, "6M"));
  results.searchSymbols = await test("searchSymbols(Apple)", () => us.searchSymbols("Apple"));
  results.getFundamentals = await test("getFundamentals(AAPL)", () => us.getFundamentals(SYMBOL));
  results.getScreener = await test("getScreener({})", () => us.getScreener({ limit: 10 }));
  results.getOptionsChain = await test("getOptionsChain(AAPL)", () => us.getOptionsChain(SYMBOL));

  console.log("\n=== Summary ===");
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`${passed}/${total} tests passed`);

  if (passed < total) {
    console.log("\nFailed tests:");
    for (const [test, result] of Object.entries(results)) {
      if (!result) console.log(`  - ${test}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test error:", err);
  process.exit(1);
});
