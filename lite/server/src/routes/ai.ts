import Anthropic from "@anthropic-ai/sdk";
import { errorResponse, json, methodNotAllowed } from "./_utils.js";

const SYSTEM = `You are the AI assistant inside OpenTerminal, a Bloomberg-style financial terminal.
You help the user interpret market data, charts, news, options chains and macro indicators.
Answer concisely and professionally, in the language the user writes in.
When market data is provided in the conversation as JSON context, ground your answer in it.
You are not a licensed financial advisor: never give personalized investment advice or tell the user what to buy or sell.`;

export function aiAvailable(): boolean { return Boolean(process.env.ANTHROPIC_API_KEY); }
let client: Anthropic | null = null;
function getClient(): Anthropic { return client || (client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })); }

export async function handleAi(req: Request, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/ai")) return null;
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST" || url.pathname !== "/api/ai/chat") return methodNotAllowed();
  if (!aiAvailable()) return json({ error: "AI assistant unavailable: set ANTHROPIC_API_KEY on the server." }, 503);
  try {
    const body = await req.json() as { messages?: unknown; context?: unknown };
    if (!Array.isArray(body.messages) || body.messages.length === 0) return json({ error: "messages array required" }, 400);
    const messages = body.context
      ? [{ role: "user", content: `Current terminal context (JSON):\n${JSON.stringify(body.context)}` }, ...body.messages]
      : body.messages;
    const response = await getClient().messages.create({ model: "claude-opus-4-8", max_tokens: 16000, thinking: { type: "adaptive" }, system: SYSTEM, messages: messages as Array<{ role: "user" | "assistant"; content: string }> });
    if (response.stop_reason === "refusal") return json({ text: "The assistant declined to answer this request." });
    return json({ text: response.content.filter((part) => part.type === "text").map((part) => part.type === "text" ? part.text : "").join("") });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("api_key") || message.includes("authentication") || message.includes("401")) return json({ error: "AI assistant unavailable: set ANTHROPIC_API_KEY on the server." }, 503);
    return errorResponse(error, 502);
  }
}
