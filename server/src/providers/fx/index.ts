import * as frankfurter from "./frankfurter.js";
import * as exchangerateHost from "./exchangerateHost.js";

// FX rates are a good caching candidate with a longer TTL: hours, not seconds.
export async function getRate(from: string, to: string): Promise<number> {
  const base = from.toUpperCase();
  const symbol = to.toUpperCase();
  if (base === symbol) return 1;

  try {
    return await frankfurter.getRate(base, symbol);
  } catch (primaryError) {
    try {
      return await exchangerateHost.getRate(base, symbol);
    } catch (fallbackError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`FX rate unavailable for ${base}/${symbol}: ${primaryMessage}; fallback: ${fallbackMessage}`);
    }
  }
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  return amount * (await getRate(from, to));
}
