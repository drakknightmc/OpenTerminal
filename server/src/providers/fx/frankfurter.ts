const ENDPOINTS = [
  "https://api.frankfurter.dev/v1/latest",
  "https://api.frankfurter.app/latest",
] as const;

export async function getRate(from: string, to: string): Promise<number> {
  const base = from.toUpperCase();
  const symbol = to.toUpperCase();
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    const url = `${endpoint}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbol)}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`frankfurter ${res.status} for ${base}/${symbol}`);

      const data = (await res.json()) as { rates?: Record<string, unknown> };
      const rate = data.rates?.[symbol];
      if (typeof rate !== "number" || !Number.isFinite(rate)) {
        throw new Error(`frankfurter returned no rate for ${base}/${symbol}`);
      }
      return rate;
    } catch (error) {
      lastError = error;
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`frankfurter unavailable for ${base}/${symbol}: ${message}`);
}
