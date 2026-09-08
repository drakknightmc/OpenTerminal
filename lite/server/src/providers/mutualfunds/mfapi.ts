const API_BASE_URL = 'https://api.mfapi.in/mf';

type Scheme = {
  schemeCode: number;
  schemeName: string;
};

type SchemeDetailsResponse = {
  meta: any;
  data: any;
  status: string;
};

async function request<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`mfapi.in request failed for ${url}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(
      `mfapi.in request failed for ${url}: HTTP ${response.status} ${response.statusText}`,
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`mfapi.in returned invalid JSON for ${url}: ${message}`);
  }
}

export async function fetchAllSchemes(): Promise<Scheme[]> {
  return request<Scheme[]>(API_BASE_URL);
}

export async function fetchSchemeDetails(
  schemeCode: number,
): Promise<SchemeDetailsResponse> {
  return request<SchemeDetailsResponse>(`${API_BASE_URL}/${schemeCode}`);
}

export async function searchSchemes(query: string): Promise<Scheme[]> {
  const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
  return request<Scheme[]>(url);
}
