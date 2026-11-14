// POST /api/ask: streams a short answer about olo as plain text.
// Requires ANTHROPIC_API_KEY in the environment (Vercel → Project → Settings → Environment Variables).
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "@/lib/olo-knowledge";

export const runtime = "nodejs";

const MODEL = "claude-haiku-5-5";   // fast and inexpensive; fine for FAQ-style answers
const MAX_TURNS = 12;               // conversation history sent to the model
const MAX_CHARS = 800;              // longest single visitor message accepted
const RATE = { windowMs: 60_000, max: 12 }; // per IP, per instance (basic abuse guard)

const client = new Anthropic();
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE.max;
}

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "anon").split(",")[0].trim();
  if (limited(ip)) return new Response("You're sending messages quickly. Give it a moment and try again.", { status: 429 });

  let messages: Msg[] = [];
  try {
    const body = await req.json();
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: Msg) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
      .slice(-MAX_TURNS);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return new Response("Bad request", { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({ model: MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("[api/ask]", err);
        controller.enqueue(encoder.encode("Sorry, I couldn't answer that just now. You can reach the team at josh@meetolo.ai."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
