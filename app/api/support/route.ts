import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const TOPICS = new Set(["Account & sign-in", "Plans & billing", "Prices & card data", "Orders & shipping", "Other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 8_000) return Response.json({ error: "Request is too large." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Please submit a valid support request." }, { status: 400 });
  }

  // Quietly discard automated form submissions.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (name.length > MAX_NAME) return Response.json({ error: "Name is too long." }, { status: 400 });
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address so support can reply." }, { status: 400 });
  }
  if (!TOPICS.has(topic)) return Response.json({ error: "Choose a support topic." }, { status: 400 });
  if (message.length < 10 || message.length > MAX_MESSAGE) {
    return Response.json({ error: "Message must be between 10 and 5,000 characters." }, { status: 400 });
  }
  if (/-----BEGIN .*PRIVATE KEY-----|\bseed phrase\b|\bpassword\s*:/i.test(message)) {
    return Response.json({ error: "For your security, remove passwords, recovery phrases, and private keys before sending." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "anna.chapko.2004@gmail.com";
  const from = process.env.SUPPORT_FROM_EMAIL ?? "Card Tracker Support <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("[support] RESEND_API_KEY is not configured");
    return Response.json({ error: "Support email is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const safeName = escapeHtml(name || "Not provided");
  const safeEmail = escapeHtml(email);
  const safeTopic = escapeHtml(topic);
  const safeMessage = escapeHtml(message);
  const text = [
    "Card Tracker support request",
    `Topic: ${topic}`,
    `Name: ${name || "Not provided"}`,
    `Reply to: ${email}`,
    "",
    message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Card Tracker Support] ${topic}`,
        text,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111"><h2>Card Tracker support request</h2><p><strong>Topic:</strong> ${safeTopic}</p><p><strong>Name:</strong> ${safeName}</p><p><strong>Reply to:</strong> ${safeEmail}</p><hr/><p style="white-space:pre-wrap;line-height:1.6">${safeMessage}</p></div>`,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error("[support] Resend rejected request:", response.status, details.slice(0, 500));
      return Response.json({ error: "We couldn't deliver your request right now. Please try again or email support directly." }, { status: 502 });
    }

    return Response.json({ ok: true, message: "Your support request was sent. We'll reply to the email address you provided." });
  } catch (error) {
    console.error("[support] email delivery failed:", error);
    return Response.json({ error: "We couldn't deliver your request right now. Please try again or email support directly." }, { status: 502 });
  }
}
