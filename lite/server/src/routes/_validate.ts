/**
 * Simple validation helpers for route handlers.
 *
 * Usage:
 *   try {
 *     const symbol = requireString(body.symbol, "symbol");
 *     const quantity = requireNumber(body.quantity, "quantity", 0.0001);
 *     const type = requireEnum(body.type, "type", ["buy", "sell"]);
 *     const date = requireDate(body.date, "date");
 *   } catch (err) {
 *     if (err instanceof ValidationError) {
 *       return json({ error: err.message }, 400);
 *     }
 *     throw err;
 *   }
 */

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";

function typeName(val: unknown): string {
  if (val === null) return "NULL";
  if (Array.isArray(val)) return "ARRAY";
  return (typeof val).toUpperCase();
}

function required(val: unknown, field: string): void {
  if (val === undefined || val === null) throw new ValidationError(`${field} is required`);
}

export function requireString(val: unknown, field: string): string {
  required(val, field);
  if (typeof val !== "string") {
    throw new ValidationError(`${field} must be STRING not ${typeName(val)}`);
  }
  return val;
}

export function requireNumber(val: unknown, field: string, min?: number, max?: number): number {
  required(val, field);
  if (typeof val !== "number" || !Number.isFinite(val)) {
    throw new ValidationError(`${field} must be NUMBER not ${typeName(val)}`);
  }
  if (min !== undefined && val < min) throw new ValidationError(`${field} must be >= ${min}`);
  if (max !== undefined && val > max) throw new ValidationError(`${field} must be <= ${max}`);
  return val;
}

export function requireEnum(val: unknown, field: string, allowed: string[]): string {
  const value = requireString(val, field);
  if (!allowed.includes(value)) {
    throw new ValidationError(`${field} must be one of ${allowed.join(", ")}`);
  }
  return value;
}

export function requireDate(val: unknown, field: string, format = "YYYY-MM-DD"): string {
  const value = requireString(val, field);
  if (format !== "YYYY-MM-DD") {
    throw new ValidationError(`${field} must use supported format YYYY-MM-DD`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${field} must be ${format}`);
  }
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`${field} must be ${format}`);
  }
  return value;
}

export function requireNonEmpty(val: string, field: string): string {
  if (!val.trim()) throw new ValidationError(`${field} is required`);
  return val;
}

export function requireMethod(req: Request, method: HttpMethod): void {
  if (req.method !== method) {
    throw new ValidationError(`method must be ${method} not ${req.method}`);
  }
}
