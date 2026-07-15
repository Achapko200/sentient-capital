import { checkRateLimit } from "@/lib/ratelimit";
import { generateSecret, generateTotp, verifyTotp } from "@/lib/mfa";
import { supabaseAdmin } from "@/lib/supabase-server";

function formatSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

async function sendSmsCode(phone: string, code: string): Promise<{ delivered: boolean; message: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    return {
      delivered: false,
      message: `No SMS provider is configured yet. Use this demo code instead: ${code}`,
    };
  }

  const body = new URLSearchParams({
    To: phone,
    Body: `Your Card Tracker verification code is ${code}`,
  });

  if (messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
  } else if (fromNumber) {
    body.set("From", fromNumber);
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      delivered: false,
      message: `SMS delivery failed: ${text}`,
    };
  }

  return {
    delivered: true,
    message: "Verification code sent successfully.",
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";

  if (!userId) {
    return Response.json({ enabled: false, method: null, secret: null });
  }

  const { data, error } = await supabaseAdmin
    .from("mfa_settings")
    .select("enabled, method, secret")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return Response.json({ enabled: false, method: null, secret: null });
  }

  return Response.json({ enabled: !!data.enabled, method: data.method ?? null, secret: data.secret ?? null });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { action, phone } = payload;

    if (action === "totp") {
      const secret = generateSecret();
      const otpUri = `otpauth://totp/CardTracker?secret=${secret}&issuer=CardTracker&algorithm=SHA1&digits=6&period=30`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpUri)}`;

      return Response.json({
        success: true,
        secret,
        otpUri,
        qrCodeUrl,
        setupCode: formatSecret(secret),
      });
    }

    if (action === "sms") {
      const phoneNumber = typeof phone === "string" ? phone.trim() : "";
      if (!phoneNumber) {
        return Response.json({ error: "Phone number is required" }, { status: 400 });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const { delivered, message } = await sendSmsCode(phoneNumber, verificationCode);

      return Response.json({
        success: true,
        delivered,
        code: verificationCode,
        message,
      });
    }

    if (action === "verify") {
      const { secret, code } = payload;
      if (typeof secret !== "string" || typeof code !== "string") {
        return Response.json({ error: "Invalid verification payload" }, { status: 400 });
      }

      return Response.json({ success: verifyTotp(secret, code) });
    }

    if (action === "enable") {
      const { userId, method, secret } = payload;
      if (typeof userId !== "string" || !userId.trim()) {
        return Response.json({ error: "User is required" }, { status: 400 });
      }
      if (method !== "app" && method !== "sms") {
        return Response.json({ error: "Unsupported MFA method" }, { status: 400 });
      }

      const { error } = await supabaseAdmin.from("mfa_settings").upsert({
        user_id: userId,
        enabled: true,
        method,
        secret: typeof secret === "string" ? secret : null,
      }, { onConflict: "user_id" });

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ success: true });
    }

    if (action === "status") {
      const { userId } = payload;
      if (typeof userId !== "string" || !userId.trim()) {
        return Response.json({ error: "User is required" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("mfa_settings")
        .select("enabled, method, secret")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        return Response.json({ error: error.message }, { status: 500 });
      }

      return Response.json({ enabled: !!data?.enabled, method: data?.method ?? null, secret: data?.secret ?? null });
    }

    return Response.json({ error: "Unsupported action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Unable to process MFA request" }, { status: 500 });
  }
}
