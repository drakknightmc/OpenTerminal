const BASE = "https://api.frankfurter.dev/v1/latest";

export async function getRate(from: string, to: string): Promise<number> {
  const base = from.toUpperCase();
  const symbol = to.toUpperCase();
  const url = `${BASE}?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`frankfurter ${res.status} for ${base}/${symbol}`);

  const data = (await res.json()) as { rates?: Record<string, unknown> };
  const rate = data.rates?.[symbol];
  if (typeof rate !== "number" || !isFinite(rate)) {
    throw new Error(`frankfurter returned no rate for ${base}/${symbol}`);
  }
  return rate;
}
