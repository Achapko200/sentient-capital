// Step 1: signed-in admin (password only) asks for a 2FA reset link by email.
import { checkRateLimit }  from "@/lib/ratelimit";
import { getVerifiedUser } from "@/lib/verify-user";
import { sendEmail }       from "@/lib/email";
import { makeResetToken }  from "@/lib/mfa-reset-token";

export const dynamic = "force-dynamic";
const APP_URL = "https://sentient-capital.vercel.app";
const BRAND   = "#1E1A4D";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  const user: any = await getVerifiedUser(req);
  const email  = String(user?.email ?? "").toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!user?.id || !email || !admins.includes(email)) return Response.json({ error: "Not authorized" }, { status: 403 });

  const link = `${APP_URL}/api/admin/mfa-reset/confirm?token=${encodeURIComponent(makeResetToken(user.id))}`;
  const sent = await sendEmail({
    to: email,
    subject: "Reset your admin two-factor authentication",
    html: `<!doctype html><html><body style="margin:0;background:#F2F4F7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #E4E7EC;border-radius:14px;overflow:hidden;">
    <tr><td style="background:${BRAND};padding:22px 32px;"><img src="${APP_URL}/email/logo/white" width="196" height="48" alt="Card Tracker" style="display:block;border:0;"></td></tr>
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 14px;font-size:22px;color:#101828;">Reset two-factor authentication</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#344054;">We received a request to reset the authenticator app for the Card Tracker admin account <strong>${email}</strong>.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#344054;">This link expires in 15 minutes. After you confirm, you'll set up a new authenticator the next time you open the admin dashboard.</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:${BRAND};">
        <a href="${link}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:#fff;text-decoration:none;">Reset two-factor</a>
      </td></tr></table>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#667085;">If you didn't request this, ignore this email and change your password. Your account stays protected.</p>
    </td></tr>
  </table>
</td></tr></table></body></html>`,
  });
  if (!sent) return Response.json({ error: "Could not send the email. Try again shortly." }, { status: 502 });
  return Response.json({ sent: true });
}
