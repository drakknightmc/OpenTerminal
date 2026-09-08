import { getTreasuryYields, getVix } from "./index";

type TreasuryYield = { maturity: string; yield: number };
type Vix = { value: number; change: number };

function isTreasuryYield(value: unknown): value is TreasuryYield {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.maturity === "string" && typeof item.yield === "number";
}

function isVix(value: unknown): value is Vix {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.value === "number" && typeof item.change === "number";
}

async function main(): Promise<void> {
  let treasuryYields: TreasuryYield[] = [];
  let vix: Vix | null = null;
  let treasuryStatus = "DEGRADED";
  let vixStatus = "DEGRADED";

  try {
    const result = await getTreasuryYields();
    if (!Array.isArray(result) || !result.every(isTreasuryYield)) {
      treasuryStatus = "FAIL";
    } else {
      treasuryYields = result;
      treasuryStatus = result.length > 0 ? "PASS" : "DEGRADED";
    }
  } catch (error) {
    console.error("[FAIL] Treasury yields threw:", error);
  }

  try {
    const result = await getVix();
    if (result !== null && !isVix(result)) {
      vixStatus = "FAIL";
    } else {
      vix = result;
      vixStatus = result ? "PASS" : "DEGRADED";
    }
  } catch (error) {
    console.error("[FAIL] VIX threw:", error);
  }

  console.log(`[${treasuryStatus}] Treasury yields:`, treasuryYields);
  console.log(`[${vixStatus}] VIX:`, vix);
  console.log(
    `Summary: treasury=${treasuryStatus}, vix=${vixStatus}`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("[FAIL] Macro smoke test:", error);
  });
}
