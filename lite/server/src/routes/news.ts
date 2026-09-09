import { getNews } from "../providers/news/index.js";
import { cached, errorResponse, json, methodNotAllowed, TTL } from "./_utils.js";
export async function handleNews(req: Request, url: URL): Promise<Response | null> {
  if (url.pathname !== "/api/news") return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const symbol = url.searchParams.get("symbol")?.trim() || "global";
    const items = await cached(`news:${symbol}`, TTL.medium, () => getNews(symbol === "global" ? undefined : symbol));
    return json({ items });
  }
  catch (error) { return errorResponse(error); }
}
