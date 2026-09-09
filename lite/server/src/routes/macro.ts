import * as macro from "../providers/macro/index.js";
import { cached, errorResponse, json, methodNotAllowed, TTL } from "./_utils.js";
export async function handleMacro(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/macro")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    if (url.pathname === "/api/macro/treasuries") return json(await cached("macro:treasuries", TTL.long, macro.getTreasuryYields));
    if (url.pathname === "/api/macro/vix") { const value = await cached("macro:vix", TTL.long, macro.getVix); return value ? json(value) : json({ error: "VIX unavailable" }, 502); }
    return json({ error: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
