import { Database } from "bun:sqlite";
import {
  initSchema,
  addTransaction,
  getHoldings,
  getTransactions,
  getRealizedPnl,
  computeNetWorth,
} from "./index.js";

const TOLERANCE = 0.01; // Allow $0.01 difference for floating point

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log("=== Portfolio Module Smoke Test ===\n");

  // Create in-memory database
  const db = new Database(":memory:");
  initSchema(db);
  console.log("✓ Schema initialized\n");

  // Mock FX conversion: 1 USD = 83 INR
  const fxConvert = async (amount: number, from: string, to: string): Promise<number> => {
    if (from === to) return amount;
    if (from === "USD" && to === "INR") return amount * 83;
    if (from === "INR" && to === "USD") return amount / 83;
    throw new Error(`Unsupported conversion: ${from} to ${to}`);
  };

  // Add transactions across different markets
  console.log("Adding transactions...");

  const usStockTx = addTransaction(db, {
    market: "us",
    symbol: "AAPL",
    type: "buy",
    quantity: 100,
    price: 50,
    date: "2024-01-01T00:00:00Z",
    notes: "Initial buy",
  });
  assert(usStockTx.id > 0, "US stock transaction created");

  const indiaStockTx = addTransaction(db, {
    market: "india",
    symbol: "TCS",
    type: "buy",
    quantity: 500,
    price: 1000,
    date: "2024-01-02T00:00:00Z",
  });
  assert(indiaStockTx.id > 0, "India stock transaction created");

  const cryptoTx = addTransaction(db, {
    market: "crypto",
    symbol: "BTC",
    type: "buy",
    quantity: 1,
    price: 60000,
    date: "2024-01-03T00:00:00Z",
  });
  assert(cryptoTx.id > 0, "Crypto transaction created");

  const mfTx = addTransaction(db, {
    market: "mf",
    symbol: "AXIS-GROWTH",
    type: "buy",
    quantity: 1000,
    price: 100,
    date: "2024-01-04T00:00:00Z",
  });
  assert(mfTx.id > 0, "Mutual fund transaction created\n");

  // Verify holdings
  const holdings = getHoldings(db);
  assert(holdings.length === 4, "4 holdings created");

  const appleHolding = holdings.find((h) => h.symbol === "AAPL");
  assert(appleHolding?.quantity === 100, "AAPL quantity is 100");
  assert(appleHolding?.avg_cost === 50, "AAPL avg_cost is $50");
  assert(appleHolding?.currency === "USD", "AAPL currency is USD");
  assert(appleHolding?.market === "us", "AAPL market is us\n");

  const tcsHolding = holdings.find((h) => h.symbol === "TCS");
  assert(tcsHolding?.quantity === 500, "TCS quantity is 500");
  assert(tcsHolding?.avg_cost === 1000, "TCS avg_cost is 1000 INR");
  assert(tcsHolding?.currency === "INR", "TCS currency is INR");
  assert(tcsHolding?.market === "india", "TCS market is india\n");

  // Verify transactions
  const txs = getTransactions(db);
  assert(txs.length === 4, "4 transactions in log\n");

  // Test weighted average cost with additional buy
  console.log("Testing weighted average cost...");
  const aapl2 = addTransaction(db, {
    market: "us",
    symbol: "AAPL",
    type: "buy",
    quantity: 50,
    price: 60,
    date: "2024-01-05T00:00:00Z",
  });
  assert(aapl2.id > 0, "Second AAPL buy created");

  const updatedApple = getHoldings(db).find((h) => h.symbol === "AAPL");
  assert(updatedApple?.quantity === 150, "AAPL quantity is 150 after second buy");
  // avg_cost = (50*100 + 60*50) / 150 = (5000 + 3000) / 150 = 8000/150 ≈ 53.33
  const expectedAvgCost = (50 * 100 + 60 * 50) / 150;
  assert(
    Math.abs(updatedApple?.avg_cost! - expectedAvgCost) < 0.01,
    `AAPL avg_cost is ~${expectedAvgCost.toFixed(2)} (weighted average)`
  );
  console.log();

  // Test realized P&L
  console.log("Testing realized P&L...");
  const aapl3 = addTransaction(db, {
    market: "us",
    symbol: "AAPL",
    type: "sell",
    quantity: 100,
    price: 70,
    date: "2024-01-06T00:00:00Z",
  });
  assert(aapl3.id > 0, "AAPL sell created");

  const realizedPnl = getRealizedPnl(db, appleHolding?.id);
  // avg_cost at time of first txs: (50*100 + 60*50)/150 = 53.33
  // Sell 100 at 70: realized = (70 - 53.33) * 100 ≈ 1666.67
  const expectedRealizedPnl = (70 - expectedAvgCost) * 100;
  assert(
    Math.abs(realizedPnl - expectedRealizedPnl) < 1,
    `Realized P&L is ~${expectedRealizedPnl.toFixed(2)}`
  );

  const updatedApple2 = getHoldings(db).find((h) => h.symbol === "AAPL");
  assert(updatedApple2?.quantity === 50, "AAPL quantity is 50 after sell");
  console.log();

  // Test net worth computation
  console.log("Computing net worth...");
  const netWorth = await computeNetWorth(db, fxConvert);

  console.log(`Total INR: ${netWorth.totalInr.toFixed(2)}`);
  console.log(`Total USD: ${netWorth.totalUsd.toFixed(2)}`);

  // Expected values: using last transaction prices (for AAPL: last tx is sell at $70)
  // AAPL: 50 qty * $70 (last price from sell tx) = $3,500
  // TCS: 500 qty * 1000 INR = 500,000 INR
  // BTC: 1 qty * $60,000 = $60,000
  // MF: 1000 qty * 100 INR = 100,000 INR

  // USD markets total: 3,500 + 60,000 = 63,500 USD
  // INR markets total: 500,000 + 100,000 = 600,000 INR

  // Total USD: 63,500 + (600,000 / 83) = 63,500 + 7,228.92 = 70,728.92
  // Total INR: (63,500 * 83) + 600,000 = 5,270,500 + 600,000 = 5,870,500

  const expectedTotalUsd = 63500 + 600000 / 83;
  const expectedTotalInr = 63500 * 83 + 600000;

  assert(
    Math.abs(netWorth.totalUsd - expectedTotalUsd) < 1,
    `Total USD is approximately ${expectedTotalUsd.toFixed(2)}`
  );
  assert(
    Math.abs(netWorth.totalInr - expectedTotalInr) < 10,
    `Total INR is approximately ${expectedTotalInr.toFixed(2)}`
  );

  // Verify by-market breakdown
  assert(netWorth.byMarket.length > 0, "Market summary exists");

  const usMktSummary = netWorth.byMarket.find((m) => m.market === "us");
  assert(usMktSummary, "US market summary exists");
  // Verify US market has AAPL only
  assert(
    Math.abs(usMktSummary!.usdValue - 3500) < 1,
    `US market native value is ~3500 USD (AAPL only)`
  );

  const cryptoMktSummary = netWorth.byMarket.find((m) => m.market === "crypto");
  assert(cryptoMktSummary, "Crypto market summary exists");
  // Verify Crypto market has BTC only
  assert(
    Math.abs(cryptoMktSummary!.usdValue - 60000) < 1,
    `Crypto market native value is ~60000 USD (BTC only)`
  );

  const indiaMktSummary = netWorth.byMarket.find((m) => m.market === "india");
  assert(indiaMktSummary, "India market summary exists");
  assert(
    Math.abs(indiaMktSummary!.inrValue - 500000) < 1,
    "India market native value is 500,000 INR"
  );

  // Verify holdings with values
  assert(netWorth.holdings.length === 4, "4 holdings in networth summary");
  const appleWithValue = netWorth.holdings.find((h) => h.symbol === "AAPL");
  assert(appleWithValue, "AAPL in holdings");
  assert(appleWithValue!.quantity === 50, "AAPL remaining qty is 50");
  // AAPL: 50 qty at last_price=$70 = 3,500 native value
  assert(
    Math.abs(appleWithValue!.nativeValue - 3500) < 1,
    "AAPL native value is 3,500 USD (50 * last_price $70)"
  );
  // unrealizedPnl = (70 - 53.33) * 50 = 833.35
  const expectedAaplPnl = (70 - expectedAvgCost) * 50;
  assert(
    Math.abs(appleWithValue!.unrealizedPnl - expectedAaplPnl) < 1,
    `AAPL unrealized P&L is ~${expectedAaplPnl.toFixed(2)} (${70} - ${expectedAvgCost.toFixed(2)}) * 50`
  );

  console.log("\n=== All tests passed! ===\n");
}

runTests().catch((e) => {
  console.error("Test failed with error:", e);
  process.exit(1);
});
