import * as mf from "../providers/mutualfunds/index.js";
import { cached, errorResponse, json, methodNotAllowed, required, TTL } from "./_utils.js";

export async function handleMf(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/mf")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/api/mf/search") { const q = required(url, "q"); if (q instanceof Response) return q; return json(await cached(`mf:search:${q}`, TTL.medium, () => mf.searchSchemes(q))); }
    const match = path.match(/^\/api\/mf\/(\d+)\/(nav|history)$/);
    if (!match) return json({ error: "Not found" }, 404);
    const code = Number(match[1]);
    if (match[2] === "nav") return json(await cached(`mf:nav:${code}`, TTL.medium, () => mf.getSchemeDetails(code)));
    return json(await cached(`mf:history:${code}`, TTL.medium, () => mf.getNavHistory(code)));
  } catch (error) { return errorResponse(error); }
}
