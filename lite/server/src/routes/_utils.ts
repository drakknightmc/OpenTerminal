import { cached } from "../cache.js";

export const TTL = { short: 30_000, medium: 300_000, long: 3_600_000 };

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export function errorResponse(error: unknown, status = 502): Response {
  return json({ error: error instanceof Error ? error.message : String(error) }, status);
}

export function required(url: URL, name: string): string | Response {
  const value = url.searchParams.get(name)?.trim();
  return value ? value : errorResponse(`${name} is required`, 400);
}

export function numberParam(url: URL, name: string, fallback?: number): number | Response {
  const raw = url.searchParams.get(name);
  if (raw === null && fallback !== undefined) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : errorResponse(`${name} must be a number`, 400);
}

export function methodNotAllowed(): Response {
  return json({ error: "Method not allowed" }, 405);
}

export { cached };
