import { convert, getRate } from "./index.js";

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

await test("USD/INR rate and conversion", async () => {
  let rate: number;
  try {
    rate = await getRate("USD", "INR");
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      "Both Frankfurter and exchangerate.host failed for USD/INR. " +
        "Set EXCHANGERATE_HOST_ACCESS_KEY for the fallback provider. " +
        `Details: ${details}`
    );
  }

  const result = await convert(100, "USD", "INR");
  console.log(`USD/INR rate: ${rate}`);
  console.log(`100 USD in INR: ${result}`);

  if (rate < 70 || rate > 100) {
    throw new Error(`expected USD/INR rate between 70 and 100, got ${rate}`);
  }
  if (result < 7000 || result > 10000) {
    throw new Error(`expected 100 USD conversion between 7000 and 10000, got ${result}`);
  }
});
