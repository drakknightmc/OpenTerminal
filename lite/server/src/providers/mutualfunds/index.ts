import {
  fetchSchemeDetails,
  searchSchemes as searchMfapiSchemes,
} from './mfapi';

export type SchemeResult = {
  schemeCode: number;
  schemeName: string;
};

export type NavEntry = {
  date: string;
  nav: number;
};

export type SchemeDetails = {
  meta: any;
  data: NavEntry[];
  status: string;
  currency: 'INR';
};

type MfapiNavEntry = {
  date: string;
  nav: string;
};

export async function searchSchemes(query: string): Promise<SchemeResult[]> {
  return searchMfapiSchemes(query);
}

export async function getSchemeDetails(schemeCode: number): Promise<SchemeDetails> {
  const details = await fetchSchemeDetails(schemeCode);

  return {
    meta: details.meta,
    data: normalizeNavHistory(details.data),
    status: details.status,
    currency: 'INR',
  };
}

export async function getLatestNav(
  schemeCode: number,
): Promise<{ date: string; nav: number }> {
  const history = await getNavHistory(schemeCode);

  if (history.length === 0) {
    throw new Error(`No NAV history found for mutual fund scheme ${schemeCode}`);
  }

  return history[history.length - 1];
}

export async function getNavHistory(
  schemeCode: number,
  from?: string,
  to?: string,
): Promise<NavEntry[]> {
  const details = await fetchSchemeDetails(schemeCode);
  const history = normalizeNavHistory(details.data);
  const fromKey = from ? dateKey(from) : undefined;
  const toKey = to ? dateKey(to) : undefined;

  return history
    .filter((entry) => {
      const key = dateKey(entry.date);
      return (!fromKey || key >= fromKey) && (!toKey || key <= toKey);
    })
    .sort((left, right) => dateKey(left.date).localeCompare(dateKey(right.date)));
}

function normalizeNavHistory(data: MfapiNavEntry[]): NavEntry[] {
  return data.map((entry) => ({
    date: entry.date,
    nav: Number(entry.nav),
  }));
}

function dateKey(date: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return date;
}

// mfapi.in already wraps AMFI's official daily NAV data, so no fallback source is needed.
