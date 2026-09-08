export type TreasuryYield = { maturity: string; yield: number };
export type Vix = { value: number; change: number };

type Observation = { date?: string; value?: string | number };

const FRED_API = "https://api.stlouisfed.org/fred/series/observations";
const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

async function observations(seriesId: string): Promise<Observation[]> {
  const apiKey = process.env.FRED_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `${FRED_API}?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(apiKey)}&file_type=json`,
      );
      if (!response.ok) throw new Error(`fred api ${response.status}`);
      const data = (await response.json()) as { observations?: Observation[] };
      if (Array.isArray(data.observations)) return data.observations;
    } catch {
      // Fall through to the public CSV endpoint.
    }
  }

  try {
    const response = await fetch(`${FRED_CSV}?id=${encodeURIComponent(seriesId)}`);
    if (!response.ok) return [];
    const lines = (await response.text()).trim().split(/\r?\n/).slice(1);
    return lines.map((line) => {
      const [date, value] = line.split(",");
      return { date, value };
    });
  } catch {
    return [];
  }
}

function numericObservations(items: Observation[]): Array<{ date: string; value: number }> {
  return items.flatMap((item) => {
    const value = Number(item.value);
    return item.date && Number.isFinite(value) ? [{ date: item.date, value }] : [];
  });
}

export async function getTreasuryYields(): Promise<TreasuryYield[]> {
  const series = [
    ["2Y", "DGS2"],
    ["5Y", "DGS5"],
    ["10Y", "DGS10"],
    ["30Y", "DGS30"],
  ] as const;

  const values = await Promise.all(
    series.map(async ([maturity, seriesId]) => {
      const points = numericObservations(await observations(seriesId));
      const latest = points.at(-1);
      return latest ? { maturity, yield: latest.value } : null;
    }),
  );

  return values.filter((value): value is TreasuryYield => value !== null);
}

export async function getVix(): Promise<Vix | null> {
  const points = numericObservations(await observations("VIXCLS"));
  const latest = points.at(-1);
  if (!latest) return null;

  const previous = points.at(-2);
  return { value: latest.value, change: previous ? latest.value - previous.value : 0 };
}
