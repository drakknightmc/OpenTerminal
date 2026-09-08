import { getHistoricalCandles, getIndices, getQuote } from "./index.js";

type SmokeTest = {
  name: string;
  run: () => Promise<void>;
};

const tests: SmokeTest[] = [
  {
    name: "getQuote RELIANCE",
    run: async () => {
      const quote = await getQuote("RELIANCE");
      if (!quote || quote.symbol.length === 0 || quote.price === null) {
        throw new Error("quote did not contain a symbol and price");
      }
    },
  },
  {
    name: "getQuote TCS",
    run: async () => {
      const quote = await getQuote("TCS");
      if (!quote || quote.symbol.length === 0 || quote.price === null) {
        throw new Error("quote did not contain a symbol and price");
      }
    },
  },
  {
    name: "getHistoricalCandles RELIANCE 1D",
    run: async () => {
      const candles = await getHistoricalCandles("RELIANCE", "1D");
      if (candles.length === 0) {
        throw new Error("no historical candles returned");
      }
    },
  },
  {
    name: "getIndices NIFTY 50 and SENSEX",
    run: async () => {
      const indices = await getIndices();
      const names = indices.map((index) => index.name.toUpperCase());
      if (!names.some((name) => name.includes("NIFTY"))) {
        throw new Error("NIFTY 50 was not returned");
      }
      if (!names.some((name) => name.includes("SENSEX"))) {
        throw new Error("SENSEX was not returned");
      }
    },
  },
];

const failures: Array<{ name: string; error: unknown }> = [];

for (const test of tests) {
  const started = performance.now();
  try {
    await test.run();
    console.log(`${test.name} - ${(performance.now() - started).toFixed(0)}ms - PASS`);
  } catch (error) {
    failures.push({ name: test.name, error });
    console.log(`${test.name} - ${(performance.now() - started).toFixed(0)}ms - FAIL`);
  }
}

const passed = tests.length - failures.length;
console.log(`\nSummary: ${passed}/${tests.length} tests passed`);

if (failures.length > 0) {
  console.log("Failed tests:");
  for (const failure of failures) {
    const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
    console.log(`- ${failure.name}: ${message}`);
  }
  process.exit(1);
}

console.log("All India equities provider smoke tests passed.");
process.exit(0);
