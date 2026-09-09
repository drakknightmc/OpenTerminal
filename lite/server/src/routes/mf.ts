import * as mf from "../providers/mutualfunds/index.js";
import { cached, errorResponse, json, methodNotAllowed, required, TTL } from "./_utils.js";

export async function handleMf(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/mf")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const path = url.pathname.replace(/\/$/, "");
    if (path === "/api/mf/search") {
      const q = required(url, "q"); if (q instanceof Response) return q;
      const results = await cached(`mf:search:${q}`, TTL.medium, () => mf.searchSchemes(q));
      return json({ results });
    }
    const match = path.match(/^\/api\/mf\/(\d+)\/(nav|history)$/) ?? path.match(/^\/api\/mf\/(nav|history)\/(\d+)$/);
    if (!match) return json({ error: "Not found" }, 404);
    const [kind, code] = /^\d+$/.test(match[1]) ? [match[2], Number(match[1])] : [match[1], Number(match[2])];
    if (kind === "nav") {
      const details = await cached(`mf:nav:${code}`, TTL.medium, () => mf.getSchemeDetails(code));
      return json({
        history: details.data,
        fundHouse: details.meta?.fund_house,
        category: details.meta?.scheme_category,
      });
    }
    const history = await cached(`mf:history:${code}`, TTL.medium, () => mf.getNavHistory(code));
    return json({ history });
  } catch (error) { return errorResponse(error); }
}
