import { convert, getRate } from "../providers/fx/index.js";
import { cached, errorResponse, json, methodNotAllowed, numberParam, required, TTL } from "./_utils.js";
export async function handleFx(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/fx")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "GET") return methodNotAllowed();
  try {
    const from = required(url, "from"); if (from instanceof Response) return from;
    const to = required(url, "to"); if (to instanceof Response) return to;
    if (url.pathname === "/api/fx/rate") return json({ from: from.toUpperCase(), to: to.toUpperCase(), rate: await cached(`fx:${from}:${to}`, TTL.long, () => getRate(from, to)) });
    if (url.pathname === "/api/fx/convert") { const amount = numberParam(url, "amount"); if (amount instanceof Response) return amount; const rate = await cached(`fx:${from}:${to}`, TTL.long, () => getRate(from, to)); return json({ amount, from: from.toUpperCase(), to: to.toUpperCase(), converted: amount * rate }); }
    return json({ error: "Not found" }, 404);
  } catch (error) { return errorResponse(error); }
}
