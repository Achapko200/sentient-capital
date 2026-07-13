import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 500 });
  }

  try {
    const { image } = await req.json();
    if (!image) return Response.json({ error: "No image provided" }, { status: 400 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:      "llama-3.2-11b-vision-preview",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image },
            },
            {
              type: "text",
              text: `You are a baseball card expert. Analyze this card image and provide:
1. Player name
2. Card year and set (e.g. "2021 Topps Chrome")
3. Card condition estimate (Poor/Good/Very Good/Excellent/Near Mint/Mint)
4. Estimated PSA grade (1-10)
5. Estimated value range in USD
6. Key observations about the card

Respond in JSON format:
{
  "player": "Name",
  "year": "Year",
  "set": "Set name",
  "condition": "Condition",
  "psaGrade": 8,
  "valueMin": 50,
  "valueMax": 150,
  "observations": ["observation 1", "observation 2"]
}`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Groq vision error:", err);
      return Response.json({ error: "Vision AI failed" }, { status: 500 });
    }

    const data    = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "Could not parse card data" }, { status: 500 });

    const cardData = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, card: cardData });
  } catch (err) {
    console.error("Scan error:", err);
    return Response.json({ error: "Failed to scan card" }, { status: 500 });
  }
}
