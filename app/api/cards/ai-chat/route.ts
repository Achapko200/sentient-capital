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

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ reply: "AI assistant is not configured yet." });
  }

  const recentMessages = messages.slice(-10);
  const playerList     = (players ?? []).map(p => p.name).join(", ");

  const systemPrompt = `You are Scout, an expert AI assistant for Card Tracker — a premium PSA-graded baseball card marketplace.

About Card Tracker:
- Buy and sell PSA-graded MLB baseball cards at market price
- Cards are physically shipped to buyers from our secure vault
- Sellers ship cards to our vault, get paid when their card sells
- Prices driven by real MLB performance data and live eBay market data
- AI-powered BUY/HOLD/SELL signals based on player stats
- Pro plan ($9.99/month): unlimited alerts, AI, card scanner
- Elite plan ($24.99/month): real-time eBay prices, advanced analytics, reduced fees

How to help users:
- Recommend which cards to buy based on MLB performance trends
- Explain what makes a card valuable (rookie cards, PSA 10 grade, player performance)
- Help users understand price signals and market trends
- Guide sellers through the listing process
- Answer questions about card grading, PSA, and the marketplace

Currently tracked players: ${playerList}

Be concise, enthusiastic about baseball cards, and knowledgeable. Not financial advice — trading education. You are Scout.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      "llama-3.1-8b-instant",
        max_tokens: 500,
        messages:   [
          { role: "system", content: systemPrompt },
          ...recentMessages.map(m => ({
            role:    m.role === "user" ? "user" : "assistant",
            content: String(m.content).slice(0, 500),
          })),
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Groq error:", err);
      return Response.json({ reply: "I'm having trouble connecting right now. Try again in a moment." });
    }

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return Response.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err);
    return Response.json({ reply: "Something went wrong. Please try again." });
  }
}