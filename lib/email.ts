// Shared email sender (Resend). Returns true when Resend accepted the email.
// RESEND_FROM: set once you verify your own domain in Resend, e.g. "Card Tracker <support@yourdomain.com>".
export async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("[email] RESEND_API_KEY is not set"); return false; }
  const from = process.env.RESEND_FROM ?? "Card Tracker <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body:    JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) { console.error("[email] Resend rejected:", res.status, await res.text().catch(() => "")); return false; }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}
