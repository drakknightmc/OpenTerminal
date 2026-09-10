export type ApiError = {
  status: number;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(body: unknown): string | null {
  if (!isRecord(body)) return null;

  const { error, message } = body;

  if (isRecord(error) && typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return null;
}

function defaultErrorMessage(status: number): string {
  if (status >= 500) return 'Server error';
  if (status >= 400) return 'Request failed';
  return 'Unexpected response';
}

/**
 * Fetch with automatic JSON parsing and error extraction.
 *
 * Usage:
 *   const quote = await fetchAPI<Quote>('/api/market/quote?symbol=AAPL');
 *   const holdings = await fetchAPI<Holding[]>('/api/portfolio/holdings', { method: 'GET' });
 *   await fetchAPI<void>('/api/portfolio/transactions', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(transaction),
 *   });
 *
 * Error handling:
 *   try {
 *     const data = await fetchAPI<Data>('/api/something');
 *   } catch (err) {
 *     if (err && typeof err === 'object' && 'status' in err) {
 *       const apiErr = err as ApiError;
 *       console.error(`[${apiErr.status}] ${apiErr.message}`);
 *     }
 *   }
 */
export async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw { status: 0, message: `Network error: ${message}` } satisfies ApiError;
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw { status: response.status, message: 'Invalid response format' } satisfies ApiError;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message: extractErrorMessage(body) ?? defaultErrorMessage(response.status),
    } satisfies ApiError;
  }

  return body as T;
}
