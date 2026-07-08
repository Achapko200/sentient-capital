import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { messages, players } = body as {
    messages: { role: string; content: string }[];
    players:  { name: string; id: string }[];
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "No messages" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ reply: "AI assistant is not configured yet." });
  }

  const recentMessages = messages.slice(-10);
  const playerList = (players ?? []).map(p => p.name).join(", ");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-6",
        max_tokens: 500,
        system: `You are a helpful baseball card trading assistant for Card Tracker — a platform where users trade shares of PSA-graded baseball cards like stocks.

Key platform features:
- Order book trading with limit BUY/SELL orders
- Cards divided into 100 tradeable shares
- Prices driven by real MLB performance data (HR, OPS, batting average)
- USDC settlement on Base network
- PSA vault — physical cards held securely, redeemable by owning 100% of shares
- Price alerts for target prices
- AI buy/sell/hold signals based on live stats

Currently tracked players: ${playerList}

Keep responses concise, helpful, and focused on card trading. Don't give financial advice — give trading education.`,
        messages: recentMessages.map(m => ({
          role:    m.role === "user" ? "user" : "assistant",
          content: String(m.content).slice(0, 500),
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Anthropic error:", err);
      return Response.json({ reply: "I'm having trouble connecting right now. Try again in a moment." });
    }

    const data  = await res.json();
    const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response.";
    return Response.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json({ reply: "Something went wrong. Please try again." });
  }
}