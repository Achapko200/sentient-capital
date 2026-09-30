// Support requests: validate -> save in Supabase -> email the support inbox (reply-to = customer)
// -> confirmation email to the customer (only once a verified sending domain is configured).
import { supabaseAdmin }  from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendEmail }      from "@/lib/email";

export const dynamic = "force-dynamic";

const APP_URL   = "https://sentient-capital.vercel.app";
const TOPICS    = ["Account & sign-in", "Plans & billing", "Prices & card data", "Orders & shipping", "Other"];
const EMAIL_RE  = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PER_EMAIL_PER_HOUR = 3;

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#F4F5F9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F9;padding:32px 12px;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#1E1A4D;padding:24px 32px;"><img src="${APP_URL}/email/logo/white" width="212" height="52" alt="Card Tracker" style="display:block;border:0;"></td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#101828;">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid #EAECF0;font-size:12px;color:#667085;">Card Tracker · PSA-graded baseball card marketplace</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

const row = (k: string, v: string) =>
  `<tr><td style="padding:8px 12px;border:1px solid #EAECF0;background:#F9FAFB;font-size:13px;color:#475467;width:110px;">${k}</td><td style="padding:8px 12px;border:1px solid #EAECF0;font-size:14px;color:#101828;">${v}</td></tr>`;

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

  // Bot filled the hidden field: pretend success, do nothing
  if (trap) return Response.json({ message: "Thanks — your support request was sent." });

  if (!EMAIL_RE.test(email) || email.length > 254) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (!TOPICS.includes(topic))                    return Response.json({ error: "Please choose a topic." }, { status: 400 });
  if (message.length < 10)                        return Response.json({ error: "Please describe the issue in at least 10 characters." }, { status: 400 });
  if (message.length > 5000)                      return Response.json({ error: "Please keep your message under 5,000 characters." }, { status: 400 });

  const supportInbox = process.env.SUPPORT_EMAIL;
  if (!supportInbox) {
    console.error("[support] SUPPORT_EMAIL is not set");
    return Response.json({ error: "Support is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  // Per-email limit
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabaseAdmin.from("support_requests")
    .select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", since);
  if ((count ?? 0) >= PER_EMAIL_PER_HOUR) {
    return Response.json({ error: "You've sent several requests in the last hour. We'll reply to those first." }, { status: 429 });
  }

  // Save first so nothing is lost
  const { data: saved, error: dbError } = await supabaseAdmin.from("support_requests")
    .insert({ name: name || null, email, topic, message, user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300) })
    .select("id").single();
  if (dbError) console.error("[support] save failed:", dbError.message);

  const ref = `CT-${(saved?.id ? String(saved.id).replace(/-/g, "").slice(0, 8) : Date.now().toString(36)).toUpperCase()}`;

  // Email the support inbox; hitting Reply answers the customer
  const sent = await sendEmail({
    to:      supportInbox,
    replyTo: email,
    subject: `[Support ${ref}] ${topic}`,
    html: shell(`New support request · ${ref}`, `
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:16px;">
        ${row("Reference", ref)}${row("Topic", esc(topic))}${row("From", `${esc(name || "—")} &lt;${esc(email)}&gt;`)}${row("Received", new Date().toUTCString())}
      </table>
      <div style="white-space:pre-wrap;font-size:15px;line-height:1.6;color:#101828;background:#F9FAFB;border:1px solid #EAECF0;border-radius:10px;padding:16px;">${esc(message)}</div>
      <p style="margin:16px 0 0;font-size:13px;color:#667085;">Reply to this email to answer the customer directly.</p>`),
  });

  if (saved?.id && sent) await supabaseAdmin.from("support_requests").update({ email_sent: true }).eq("id", saved.id);
  if (!sent && !saved?.id) {
    return Response.json({ error: "We couldn't send your request. Please try again in a few minutes." }, { status: 502 });
  }

  // Confirmation to the customer — only possible from a verified domain (RESEND_FROM)
  if (process.env.RESEND_FROM) {
    await sendEmail({
      to:      email,
      subject: `We got your message (${ref})`,
      html: shell("We got your message", `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#344054;">Hi${name ? " " + esc(name) : ""}, thanks for contacting Card Tracker support. We received your request about <strong>${esc(topic)}</strong> and will reply to this email address.</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#344054;">Your reference number is <strong>${ref}</strong>.</p>
        <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#475467;background:#F9FAFB;border:1px solid #EAECF0;border-radius:10px;padding:16px;">${esc(message)}</div>`),
    });
  }

  return Response.json({ message: `Thanks — your request ${ref} was sent. We'll reply to ${email}.` });
}
