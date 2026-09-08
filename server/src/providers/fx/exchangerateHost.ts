const BASE = "https://api.exchangerate.host/latest";

export async function getRate(from: string, to: string): Promise<number> {
  const accessKey = process.env.EXCHANGERATE_HOST_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("exchangerate.host requires EXCHANGERATE_HOST_ACCESS_KEY");
  }

  const base = from.toUpperCase();
  const symbol = to.toUpperCase();
  const url = `${BASE}?access_key=${encodeURIComponent(accessKey)}&base=${encodeURIComponent(
    base
  )}&symbols=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`exchangerate.host ${res.status} for ${base}/${symbol}`);

  const data = (await res.json()) as {
    success?: boolean;
    error?: { info?: string };
    rates?: Record<string, unknown>;
  };
  if (data.success === false) {
    throw new Error(`exchangerate.host: ${data.error?.info ?? "request failed"}`);
  }
  const rate = data.rates?.[symbol];
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`exchangerate.host returned no rate for ${base}/${symbol}`);
  }
  return rate;
}
