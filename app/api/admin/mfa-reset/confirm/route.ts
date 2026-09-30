// Step 2: the emailed link shows a confirm page; pressing the button removes the admin's authenticator factors.
import { supabaseAdmin }   from "@/lib/supabase-server";
import { readResetToken }  from "@/lib/mfa-reset-token";
import { securityAlert }   from "@/lib/security-guard";

export const dynamic = "force-dynamic";

const page = (title: string, body: string) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#030712;color:#fff;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
<div style="max-width:380px;width:100%;margin:24px;padding:28px;border:1px solid #1f2937;border-radius:16px;background:#0b1220;">
<h1 style="margin:0 0 10px;font-size:20px;">${title}</h1>${body}</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

const expired = () => page("Link expired", `<p style="color:#9ca3af;font-size:14px;line-height:1.6;">This reset link is invalid or has expired. Go to the admin dashboard and request a new one.</p>
<a href="/admin" style="display:inline-block;margin-top:14px;color:#60a5fa;font-size:14px;">Back to admin</a>`);

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!readResetToken(token)) return expired();
  return page("Reset two-factor?", `<p style="color:#9ca3af;font-size:14px;line-height:1.6;">This removes your current authenticator. You'll scan a new QR code the next time you open the admin dashboard.</p>
<form method="POST" style="margin-top:18px;"><input type="hidden" name="token" value="${token.replace(/[^A-Za-z0-9._-]/g, "")}">
<button style="width:100%;padding:12px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-size:14px;font-weight:700;cursor:pointer;">Confirm reset</button></form>`);
}

export async function POST(req: Request) {
  const form   = await req.formData().catch(() => null);
  const userId = readResetToken(String(form?.get("token") ?? ""));
  if (!userId) return expired();

  const { data, error } = await (supabaseAdmin.auth.admin as any).mfa.listFactors({ userId });
  if (error) return page("Something went wrong", `<p style="color:#9ca3af;font-size:14px;">${String(error.message).replace(/</g, "&lt;")}</p>`);
  for (const f of data?.factors ?? []) await (supabaseAdmin.auth.admin as any).mfa.deleteFactor({ id: f.id, userId });

  await securityAlert({
    kind: "mfa-reset", severity: "Medium",
    title: "Admin two-factor authentication was reset",
    happened: "The admin authenticator was removed using an emailed reset link.",
    action: "All authenticator factors for the admin account were deleted. A new one must be set up at the next admin visit.",
    next: "If you didn't do this, change your password immediately and set up two-factor again.",
    details: { "User ID": userId },
  }).catch(() => {});

  return new Response(null, { status: 303, headers: { Location: "/admin" } });
}
