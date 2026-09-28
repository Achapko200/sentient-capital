import { checkRateLimit } from "@/lib/ratelimit";
import { scanForSensitiveData } from "@/lib/dlp";
import { readJsonBody } from "@/lib/request-body";

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
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return Response.json({ error: "Cross-site support requests are not allowed." }, { status: 403 });
  }
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(req.url).origin) {
        return Response.json({ error: "Cross-origin support requests are not allowed." }, { status: 403 });
      }
    } catch {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const parsedBody = await readJsonBody(req, 8_000);
  if (!parsedBody.ok) {
    return Response.json(
      { error: parsedBody.reason === "too_large" ? "Request is too large." : "Please submit a valid support request." },
      { status: parsedBody.reason === "too_large" ? 413 : 400 },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return Response.json({ error: "Please submit a valid support request." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;

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
  const supportText = `${name}\n${message}`;
  if (scanForSensitiveData(`${supportText}\n${email}`).found || /\bseed phrase\b|\brecovery phrase\b|\bpassword\s*:/i.test(`${supportText}\n${email}`)) {
    return Response.json({ error: "For your security, remove passwords, recovery phrases, private keys, payment-card numbers, and access tokens before sending." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL ?? process.env.NEXT_PUBLIC_SUPPORT_EMAIL ??
    (process.env.NODE_ENV === "production" ? "" : "anna.chapko.2004@gmail.com");
  const from = process.env.SUPPORT_FROM_EMAIL ?? "Card Tracker Support <onboarding@resend.dev>";
  if (!to || !EMAIL_RE.test(to)) {
    console.error("[support] SUPPORT_EMAIL is not configured with a valid destination");
    return Response.json({ error: "Support email is not configured. Please use the direct email contact shown on this page." }, { status: 503 });
  }
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
