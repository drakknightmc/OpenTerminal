export type CryptoAsset = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  rank: number | null;
  sparkline: number[];
};

const BASE_URL = "https://api.coingecko.com/api/v3";
const JSON_HEADERS = { Accept: "application/json" };

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function request(path: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: JSON_HEADERS });
  } catch (error) {
    throw new Error(`CoinGecko request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) throw new Error(`CoinGecko request failed with HTTP ${response.status}`);
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`CoinGecko returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function toAsset(row: any, id = row?.id): CryptoAsset {
  const price = numberOrNull(row?.current_price ?? row?.market_data?.current_price?.usd);
  if (!id || !row?.symbol || !row?.name || price === null) {
    throw new Error("CoinGecko returned an incomplete crypto asset");
  }
  return {
    id,
    symbol: String(row.symbol).toUpperCase(),
    name: String(row.name),
    price,
    changePercent24h: numberOrNull(row?.price_change_percentage_24h ?? row?.market_data?.price_change_percentage_24h),
    marketCap: numberOrNull(row?.market_cap?.usd ?? row?.market_data?.market_cap?.usd),
    volume24h: numberOrNull(row?.total_volume?.usd ?? row?.market_data?.total_volume?.usd),
    rank: numberOrNull(row?.market_cap_rank),
    sparkline: Array.isArray(row?.sparkline_in_7d?.price) ? row.sparkline_in_7d.price.filter((v: unknown) => typeof v === "number") : [],
  };
}

export async function getMarkets(limit = 50): Promise<CryptoAsset[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    throw new Error("CoinGecko market limit must be an integer between 1 and 250");
  }
  const rows = await request(`/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`);
  if (!Array.isArray(rows)) throw new Error("CoinGecko markets response was not an array");
  return rows.map((row) => toAsset(row));
}

export async function getGlobalStats(): Promise<{ btc: number; eth: number; totalMarketCap: number }> {
  const data = (await request("/global"))?.data;
  if (!data) throw new Error("CoinGecko global response did not contain data");
  return {
    btc: numberOrNull(data.market_cap_percentage?.btc) ?? 0,
    eth: numberOrNull(data.market_cap_percentage?.eth) ?? 0,
    totalMarketCap: numberOrNull(data.total_market_cap?.usd) ?? 0,
  };
}

export async function getQuote(coingeckoId: string): Promise<CryptoAsset> {
  const id = coingeckoId.trim();
  if (!id) throw new Error("CoinGecko asset id is required");
  const row = await request(`/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
  return toAsset(row, id);
}
