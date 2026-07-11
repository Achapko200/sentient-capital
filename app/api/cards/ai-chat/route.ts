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

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  if (!anthropicKey && !openAiKey) {
    return Response.json({ reply: "The AI assistant is currently unavailable because no live model key is configured." });
  }

  const recentMessages = messages.slice(-10);
  const playerList = (players ?? []).map(p => p.name).join(", ");
  const systemPrompt = `You are a helpful baseball card trading assistant for Card Tracker — a platform where users trade shares of PSA-graded baseball cards like stocks.

Key platform features:
- Order book trading with limit BUY/SELL orders
- Cards divided into 100 tradeable shares
- Prices driven by real MLB performance data (HR, OPS, batting average)
- USDC settlement on Base network
- PSA vault — physical cards held securely, redeemable by owning 100% of shares
- Price alerts for target prices
- AI buy/sell/hold signals based on live stats

Currently tracked players: ${playerList}

Keep responses concise, helpful, and focused on card trading. Don't give financial advice — give trading education.`;

  try {
    if (anthropicKey) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      };

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          system: systemPrompt,
          messages: recentMessages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: String(m.content).slice(0, 500),
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.content?.[0]?.text ?? "Sorry, I couldn't generate a response.";
        return Response.json({ reply });
      }

      const err = await res.json().catch(() => ({}));
      console.error("Anthropic error:", err);
    }

    if (openAiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            ...recentMessages.map(m => ({
              role: m.role === "user" ? "user" : "assistant",
              content: String(m.content).slice(0, 500),
            })),
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a response.";
        return Response.json({ reply });
      }

      const err = await res.json().catch(() => ({}));
      console.error("OpenAI error:", err);
    }

    return Response.json({ reply: "The AI assistant could not reach the live model. Please try again later." });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json({ reply: "The AI assistant could not reach the live model. Please try again later." });
  }
}