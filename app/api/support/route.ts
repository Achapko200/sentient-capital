// Support requests: validate -> save in Supabase -> email the support inbox (reply-to = customer)
// -> confirmation email to the customer (only once a verified sending domain is configured).
import { supabaseAdmin }  from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendEmail }      from "@/lib/email";

export const dynamic = "force-dynamic";

const APP_URL  = "https://sentient-capital.vercel.app";
const BRAND    = "#1E1A4D";
const TOPICS   = ["Account & sign-in", "Plans & billing", "Prices & card data", "Orders & shipping", "Other"];
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PER_EMAIL_PER_HOUR = 3;
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const formatET = (d: Date) =>
  d.toLocaleString("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
   .replace(",", "").replace(/ (\d{4}) /, ", $1 at ") + " ET";

// ── Shared frame ────────────────────────────────────────────────────────────
function frame({ label, preheader, body }: { label: string; preheader: string; body: string }) {
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Card Tracker</title></head>
<body style="margin:0;padding:0;background:#F2F4F7;font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F7;padding:40px 12px;"><tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:12px;overflow:hidden;">
    <tr><td style="background:${BRAND};padding:22px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><img src="${APP_URL}/email/logo/white" width="196" height="48" alt="Card Tracker" style="display:block;border:0;"></td>
        <td align="right" style="font-size:12px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#C7C4F2;">${label}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:36px 36px 28px;">${body}</td></tr>
    <tr><td style="padding:22px 36px;background:#F9FAFB;border-top:1px solid #EAECF0;">
      <p style="margin:0 0 6px;font-size:12px;line-height:1.6;color:#667085;">This message was generated automatically by the Card Tracker support system.</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#98A2B3;">&copy; ${year} Card Tracker &middot; PSA-graded baseball card marketplace &middot; <a href="${APP_URL}" style="color:#98A2B3;">sentient-capital.vercel.app</a></p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const detailRow = (k: string, v: string, last = false) =>
  `<tr>
    <td style="padding:12px 16px;${last ? "" : "border-bottom:1px solid #EAECF0;"}font-size:13px;color:#667085;width:150px;vertical-align:top;">${k}</td>
    <td style="padding:12px 16px;${last ? "" : "border-bottom:1px solid #EAECF0;"}font-size:14px;color:#101828;font-weight:500;">${v}</td>
  </tr>`;

const sectionLabel = (t: string) =>
  `<p style="margin:28px 0 10px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#475467;">${t}</p>`;

// ── Internal ticket notice (to the support inbox) ───────────────────────────
function ticketEmail({ ref, topic, name, email, message, submitted }: { ref: string; topic: string; name: string; email: string; message: string; submitted: string }) {
  const replySubject = encodeURIComponent(`Re: Support Ticket ${ref} · ${topic}`);
  return frame({
    label: "Customer Support",
    preheader: `New ticket ${ref} from ${name || email}: ${message.slice(0, 90)}`,
    body: `
      <p style="margin:0 0 6px;font-size:13px;color:#667085;">Support Ticket</p>
      <h1 style="margin:0 0 14px;font-size:24px;line-height:1.3;font-weight:700;color:#101828;">${ref}</h1>
      <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:#FEF6E7;border:1px solid #FEDF89;font-size:12px;font-weight:600;color:#B54708;">Open &middot; Awaiting response</span>

      ${sectionLabel("Ticket details")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EAECF0;border-radius:8px;border-collapse:separate;">
        ${detailRow("Ticket ID", ref)}
        ${detailRow("Category", esc(topic))}
        ${detailRow("Customer", esc(name || "Not provided"))}
        ${detailRow("Email", `<a href="mailto:${esc(email)}" style="color:${BRAND};text-decoration:none;">${esc(email)}</a>`)}
        ${detailRow("Submitted", submitted)}
        ${detailRow("Channel", "Web form (Help Center)", true)}
      </table>

      ${sectionLabel("Customer message")}
      <div style="border-left:3px solid ${BRAND};background:#F9FAFB;padding:16px 18px;font-size:15px;line-height:1.65;color:#101828;white-space:pre-wrap;">${esc(message)}</div>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="border-radius:8px;background:${BRAND};">
        <a href="mailto:${esc(email)}?subject=${replySubject}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">Reply to Customer</a>
      </td></tr></table>
      <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#667085;">You can also reply directly to this email; your response will be sent to the customer. Please include the ticket ID <strong>${ref}</strong> in all correspondence.</p>
      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#98A2B3;">Confidential: this message contains customer information. Do not forward outside Card Tracker.</p>`,
  });
}

// ── Customer confirmation ───────────────────────────────────────────────────
function confirmationEmail({ ref, topic, name, message, submitted }: { ref: string; topic: string; name: string; message: string; submitted: string }) {
  return frame({
    label: "Customer Support",
    preheader: `We received your request ${ref}. Our team will respond by email.`,
    body: `
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;font-weight:700;color:#101828;">We've received your request</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#344054;">Dear ${esc(name || "Customer")},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#344054;">Thank you for contacting Card Tracker Support. This email confirms that we have received your request. A member of our team will review it and respond to this email address, typically within one business day.</p>

      ${sectionLabel("Request summary")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EAECF0;border-radius:8px;border-collapse:separate;">
        ${detailRow("Ticket ID", ref)}
        ${detailRow("Category", esc(topic))}
        ${detailRow("Submitted", submitted, true)}
      </table>

      ${sectionLabel("Your message")}
      <div style="border-left:3px solid ${BRAND};background:#F9FAFB;padding:16px 18px;font-size:14px;line-height:1.65;color:#475467;white-space:pre-wrap;">${esc(message)}</div>

      <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:#344054;">If you have additional information, simply reply to this email and reference ticket <strong>${ref}</strong>. For your security, never share passwords, payment-card details, or private keys with us.</p>
      <p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:#344054;">Sincerely,<br><strong>Card Tracker Support</strong></p>`,
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: any;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const name    = String(body?.name ?? "").trim().slice(0, 100);
  const email   = String(body?.email ?? "").trim().toLowerCase();
  const topic   = String(body?.topic ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const trap    = String(body?.website ?? "").trim();

  if (trap) return Response.json({ message: "Thank you. Your support request has been submitted." });

  if (!EMAIL_RE.test(email) || email.length > 254) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (!TOPICS.includes(topic))                    return Response.json({ error: "Please choose a topic." }, { status: 400 });
  if (message.length < 10)                        return Response.json({ error: "Please describe the issue in at least 10 characters." }, { status: 400 });
  if (message.length > 5000)                      return Response.json({ error: "Please keep your message under 5,000 characters." }, { status: 400 });

  const supportInbox = process.env.SUPPORT_EMAIL;
  if (!supportInbox) {
    console.error("[support] SUPPORT_EMAIL is not set");
    return Response.json({ error: "Support is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabaseAdmin.from("support_requests")
    .select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= PER_EMAIL_PER_HOUR) {
    return Response.json({ error: "You have submitted several requests in the past hour. Our team will respond to those first." }, { status: 429 });
  }

  const { data: saved, error: dbError } = await supabaseAdmin.from("support_requests")
    .insert({ name: name || null, email, topic, message, user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300) })
    .select("id").single();
  if (dbError) console.error("[support] save failed:", dbError.message);

  const ref       = `CT-${(saved?.id ? String(saved.id).replace(/-/g, "").slice(0, 8) : Date.now().toString(36)).toUpperCase()}`;
  const submitted = formatET(new Date());

  const sent = await sendEmail({
    to:      supportInbox,
    replyTo: email,
    subject: `Support Ticket ${ref} · ${topic}`,
    html:    ticketEmail({ ref, topic, name, email, message, submitted }),
  });

  if (saved?.id && sent) await supabaseAdmin.from("support_requests").update({ email_sent: true }).eq("id", saved.id);
  if (!sent && !saved?.id) {
    return Response.json({ error: "We were unable to submit your request. Please try again in a few minutes." }, { status: 502 });
  }

  if (process.env.RESEND_FROM) {
    await sendEmail({
      to:      email,
      subject: `We've received your request · Ticket ${ref}`,
      html:    confirmationEmail({ ref, topic, name, message, submitted }),
    });
  }

  return Response.json({ message: `Thank you. Your request ${ref} has been submitted, and our team will respond to ${email}.` });
}
