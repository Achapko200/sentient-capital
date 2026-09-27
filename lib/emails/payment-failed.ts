// lib/emails/payment-failed.ts
// Card Tracker — "Payment failed" email (HTML + plain-text), filled from a Stripe invoice.

import type Stripe from "stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sentient-capital.vercel.app";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "anna.chapko.2004@gmail.com";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS ?? "New York, NY";
const MAX_ATTEMPTS = 5; // must match Stripe > Revenue recovery > Retries (first charge + retries)

export type PaymentFailedVars = {
  first_name: string;
  card_brand: string;
  card_last4: string;
  amount_due: string;
  due_date: string;
  update_payment_url: string;
  period_start: string;
  period_end: string;
  invoice_number: string;
  invoice_url: string;
  attempt_label: string;
  seg1: string;
  seg2: string;
  seg3: string;
  seg4: string;
  preheader: string;
  retry_date_label: string;
  retry_title: string;
  retry_body: string;
  support_email: string;
  headline: string;
  intro: string;
  cta_label: string;
  status_label: string;
  step1: string;
  amount_label: string;
  secure_note: string;
  features_heading: string;
  step3_label: string;
  step3_title: string;
  step3_body: string;
  logo_url: string;
  logo_dark_url: string;
  company_address: string;
  app_url: string;
  help_center_url: string;
  billing_settings_url: string;
  terms_url: string;
  privacy_url: string;
  year: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (unix?: number | null) =>
  unix
    ? new Date(unix * 1000).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
      })
    : "";

const fmtMoney = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function fill(template: string, vars: PaymentFailedVars, html: boolean) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: keyof PaymentFailedVars) => {
    const v = vars[key] ?? "";
    return html ? escapeHtml(v) : v;
  });
}

// ── Build variables from Stripe ────────────────────────────────────────────
export async function buildPaymentFailedVars(stripe: Stripe, invoice: Stripe.Invoice): Promise<PaymentFailedVars> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  let card_brand = "card";
  let card_last4 = "••••";
  if (customerId) {
    try {
      const pms = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
      const card = pms.data[0]?.card;
      if (card) {
        card_brand = cap(card.brand);
        card_last4 = card.last4;
      }
    } catch (err) {
      console.error("[payment-failed] could not load card:", err);
    }
  }

  const line = invoice.lines?.data?.[0];
  const firstName = (invoice.customer_name ?? "").trim().split(/\s+/)[0] || "there";
  const amount = fmtMoney(invoice.amount_due ?? 0, invoice.currency);

  const attempt = Math.min(Math.max(invoice.attempt_count ?? 1, 1), MAX_ATTEMPTS);
  const nextRetry = fmtDate(invoice.next_payment_attempt);
  const isFinal = !invoice.next_payment_attempt || (invoice.attempt_count ?? 0) >= MAX_ATTEMPTS;
  const seg = (n: number) => (n <= Math.ceil((attempt / MAX_ATTEMPTS) * 4) ? "#E5484D" : "#E6E8F0");

  return {
    first_name: firstName,
    card_brand,
    card_last4,
    amount_due: amount,
    due_date: fmtDate(invoice.due_date) || fmtDate(Math.floor(Date.now() / 1000)),
    update_payment_url: isFinal ? `${APP_URL}/pricing` : invoice.hosted_invoice_url ?? `${APP_URL}/pricing`,
    period_start: fmtDate(line?.period?.start ?? invoice.period_start),
    period_end: fmtDate(line?.period?.end ?? invoice.period_end),
    invoice_number: invoice.number ?? invoice.id ?? "",
    invoice_url: invoice.hosted_invoice_url ?? `${APP_URL}/pricing`,
    attempt_label: isFinal ? `Final payment attempt failed · Subscription canceled` : `Payment attempt ${attempt} of ${MAX_ATTEMPTS} · Next retry ${nextRetry}`,
    seg1: seg(1),
    seg2: seg(2),
    seg3: seg(3),
    seg4: seg(4),
    preheader: isFinal
      ? `Your Card Tracker Pro subscription has been canceled after we couldn't collect ${amount}.`
      : `We were unable to charge your ${card_brand} ending in ${card_last4}. Please update your payment method.`,
    retry_date_label: isFinal ? "Today" : nextRetry,
    retry_title: isFinal ? "Subscription canceled" : "Automatic retry",
    retry_body: isFinal
      ? "All payment retries failed. You can resubscribe at any time."
      : "We'll attempt to charge your payment method on file again.",
    support_email: SUPPORT_EMAIL,
    headline: isFinal ? "Your Pro subscription has been canceled" : "We couldn't process your payment",
    intro: isFinal
      ? `Hi ${firstName}, after several attempts we couldn't charge your ${card_brand} ending in ${card_last4}, so your Card Tracker Pro subscription has been canceled. Your account, watchlist and collection data are kept, and you can resubscribe at any time.`
      : `Hi ${firstName}, the charge to your ${card_brand} ending in ${card_last4} was declined. Your Pro features are paused until it's resolved. Your collection and account data are safe.`,
    cta_label: isFinal ? "Resubscribe to Pro" : "Update payment method",
    status_label: isFinal ? "Subscription canceled" : "Payment failed",
    step1: isFinal ? "Final payment attempt declined." : "Payment declined. Pro features are paused.",
    step3_label: isFinal ? "Anytime" : "After final retry",
    amount_label: isFinal ? "Unpaid amount" : "Amount due",
    secure_note: isFinal ? "Secured by Stripe · Pro is back instantly when you resubscribe" : "Secured by Stripe · Pro is restored the moment payment succeeds",
    features_heading: isFinal ? "No longer included in your plan" : "Paused until you update",
    step3_title: isFinal ? "Resubscribe" : "Subscription canceled",
    step3_body: isFinal ? "Your account, watchlist and collection data will be here when you come back." : "Your account and collection data are kept.",
    logo_url: `${APP_URL}/email/logo/white`,
    logo_dark_url: `${APP_URL}/email/logo/dark`,
    company_address: COMPANY_ADDRESS,
    app_url: APP_URL,
    help_center_url: `mailto:${SUPPORT_EMAIL}`,
    billing_settings_url: `${APP_URL}/settings`,
    terms_url: `${APP_URL}/terms`,
    privacy_url: `${APP_URL}/privacy`,
    year: String(new Date().getFullYear()),
  };
}

export function renderPaymentFailedEmail(vars: PaymentFailedVars) {
  return {
    subject: vars.status_label === "Subscription canceled"
      ? "Your Card Tracker Pro subscription has been canceled"
      : "Action required: Payment failed for your Card Tracker Pro subscription",
    html: fill(PAYMENT_FAILED_HTML, vars, true),
    text: fill(PAYMENT_FAILED_TEXT, vars, false),
  };
}

// ── Plain-text version ─────────────────────────────────────────────────────
const PAYMENT_FAILED_TEXT = `Card Tracker — {{status_label}}

{{headline}}

{{intro}}

{{amount_label}}: {{amount_due}}
Due date: {{due_date}}
{{attempt_label}}

{{cta_label}}:
{{update_payment_url}}

PAYMENT SUMMARY
Plan: Card Tracker Pro (Monthly)
Billing period: {{period_start}} - {{period_end}}
Payment method: {{card_brand}} ending in {{card_last4}}
Invoice: {{invoice_number}}
View invoice: {{invoice_url}}

WHAT HAPPENS NEXT
- Today: {{step1}}
- {{retry_date_label}}: {{retry_title}}. {{retry_body}}
- {{step3_label}}: {{step3_title}}. {{step3_body}}

COMMON REASONS FOR A DECLINE
- The card has expired or been replaced
- The billing address has changed
- Your bank placed a security hold on the charge

If your card details are correct, contact your card issuer to authorize the payment, then retry using the link above.

Questions about your bill? Reply to this email or contact {{support_email}}.

Card Tracker Billing

---
Card Tracker will never ask for your full card number or password by email.
Card Tracker, Inc. · {{company_address}}
Manage billing: {{billing_settings_url}}
`;

// ── HTML version ───────────────────────────────────────────────────────────
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const PAYMENT_FAILED_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Payment failed - Card Tracker</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>td, th, div, p, a, h1, span { font-family: Arial, Helvetica, sans-serif !important; }</style>
  <![endif]-->
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    body { margin:0; padding:0; width:100% !important; background-color:#F3F4F8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; display:block; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; }
    @media only screen and (max-width:620px) {
      .container { width:100% !important; }
      .band { padding:28px 20px 0 !important; }
      .px { padding-left:22px !important; padding-right:22px !important; }
      .h1 { font-size:24px !important; line-height:31px !important; }
      .amount { font-size:38px !important; line-height:44px !important; }
      .stack { display:block !important; width:100% !important; text-align:left !important; }
      .stack-gap { padding-top:14px !important; }
      .when { width:104px !important; }
      .tile { display:block !important; width:100% !important; padding:0 0 10px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F3F4F8;">

  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F3F4F8;">
    {{preheader}}
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F3F4F8" style="background-color:#F3F4F8;">
    <tr>
      <td align="center" style="padding:0;">

        <!-- ===== Brand band ===== -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="#1E1A4D" style="background-color:#1E1A4D;">
              <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
                <tr>
                  <td class="band" bgcolor="#1E1A4D" style="padding:30px 20px 0; background-color:#1E1A4D; font-family:${FONT};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <a href="{{app_url}}" style="text-decoration:none;"><img src="{{logo_url}}" width="170" height="42" alt="Card Tracker" style="width:170px; height:42px; color:#FFFFFF; font-size:20px; font-weight:700;"></a>
                        </td>
                        <td align="right" valign="middle" style="font-size:12px; font-weight:600; color:#FFFFFF; letter-spacing:1.2px;">BILLING</td>
                      </tr>
                    </table>
                    <div style="height:32px; line-height:32px; font-size:0;">&nbsp;</div>

                    <!-- Summary card (top half, sits on band) -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border-radius:14px 14px 0 0;">
                      <tr>
                        <td class="px" style="padding:30px 32px 0; font-family:${FONT};">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td bgcolor="#FDECEC" style="padding:5px 11px; background-color:#FDECEC; border:1px solid #F9C9C9; border-radius:999px; font-size:12px; font-weight:600; color:#B4232A;">&#9679;&nbsp; {{status_label}}</td>
                            </tr>
                          </table>
                          <h1 class="h1" style="margin:16px 0 10px; font-size:28px; line-height:36px; font-weight:700; color:#0F1222; letter-spacing:-0.6px;">{{headline}}</h1>
                          <p style="margin:0 0 26px; font-size:15px; line-height:24px; color:#3F4458;">
                            {{intro}}
                          </p>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDEEF3;">
                            <tr>
                              <td class="stack" valign="bottom" style="padding-top:22px;">
                                <p style="margin:0 0 6px; font-size:13px; font-weight:500; color:#6B7085;">{{amount_label}}</p>
                                <p class="amount" style="margin:0; font-size:44px; line-height:48px; font-weight:700; color:#0F1222; letter-spacing:-1.5px;">{{amount_due}}</p>
                              </td>
                              <td class="stack stack-gap" align="right" valign="bottom" style="padding-top:22px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" class="stack">
                                  <tr>
                                    <td bgcolor="#FDECEC" style="padding:5px 11px; background-color:#FDECEC; border-radius:999px; font-size:12px; font-weight:600; color:#C4282E;">Due {{due_date}}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ===== Summary card (bottom half) + rest ===== -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
          <tr>
            <td style="padding:0 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border-radius:0 0 14px 14px; box-shadow:0 12px 32px rgba(16,18,40,0.08);">

                <!-- Attempts -->
                <tr>
                  <td class="px" style="padding:22px 32px 0; font-family:${FONT};">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="24%" height="5" bgcolor="{{seg1}}" style="height:5px; background-color:{{seg1}}; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td>
                        <td width="1%" style="font-size:0; line-height:0;">&nbsp;</td>
                        <td width="24%" height="5" bgcolor="{{seg2}}" style="height:5px; background-color:{{seg2}}; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td>
                        <td width="1%" style="font-size:0; line-height:0;">&nbsp;</td>
                        <td width="24%" height="5" bgcolor="{{seg3}}" style="height:5px; background-color:{{seg3}}; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td>
                        <td width="1%" style="font-size:0; line-height:0;">&nbsp;</td>
                        <td width="25%" height="5" bgcolor="{{seg4}}" style="height:5px; background-color:{{seg4}}; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    <p style="margin:9px 0 0; font-size:12px; color:#6B7085;">{{attempt_label}}</p>
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td class="px" style="padding:18px 32px 0; font-family:${FONT}; font-size:14px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:12px 0; color:#6B7085; border-top:1px solid #EDEEF3;">Plan</td>
                        <td align="right" style="padding:12px 0; color:#0F1222; font-weight:500; border-top:1px solid #EDEEF3;">Card Tracker Pro &middot; Monthly</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0; color:#6B7085; border-top:1px solid #EDEEF3;">Billing period</td>
                        <td align="right" style="padding:12px 0; color:#0F1222; font-weight:500; border-top:1px solid #EDEEF3;">{{period_start}} &ndash; {{period_end}}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0; color:#6B7085; border-top:1px solid #EDEEF3;">Payment method</td>
                        <td align="right" style="padding:12px 0; color:#0F1222; font-weight:500; border-top:1px solid #EDEEF3;">{{card_brand}} &bull;&bull;&bull;&bull; {{card_last4}}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0; color:#6B7085; border-top:1px solid #EDEEF3; border-bottom:1px solid #EDEEF3;">Invoice</td>
                        <td align="right" style="padding:12px 0; border-top:1px solid #EDEEF3; border-bottom:1px solid #EDEEF3;"><a href="{{invoice_url}}" style="color:#4F46E5; text-decoration:none; font-weight:500;">{{invoice_number}} &rarr;</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="px" style="padding:26px 32px 0;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{update_payment_url}}" style="height:52px; v-text-anchor:middle; width:496px;" arcsize="20%" stroke="f" fillcolor="#4F46E5">
                      <w:anchorlock/>
                      <center style="color:#FFFFFF; font-family:Arial, sans-serif; font-size:16px; font-weight:bold;">{{cta_label}}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{update_payment_url}}" style="display:block; background-color:#4F46E5; background-image:linear-gradient(135deg,#4F46E5 0%,#6D3DF0 100%); color:#FFFFFF; font-family:${FONT}; font-size:16px; font-weight:600; line-height:52px; text-align:center; text-decoration:none; border-radius:10px; box-shadow:0 6px 16px rgba(79,70,229,0.28);">{{cta_label}}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
                <tr>
                  <td class="px" align="center" style="padding:12px 32px 30px; font-family:${FONT}; font-size:12px; color:#8A8FA3;">
                    &#128274;&nbsp; {{secure_note}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== What happens next ===== -->
          <tr>
            <td style="padding:16px 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border-radius:14px;">
                <tr>
                  <td class="px" style="padding:26px 32px 20px; font-family:${FONT};">
                    <p style="margin:0 0 6px; font-size:16px; font-weight:700; color:#0F1222; letter-spacing:-0.2px;">What happens next</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px; line-height:21px;">
                      <tr>
                        <td class="when" width="132" valign="top" style="padding:13px 12px 13px 0; color:#C4282E; font-weight:600;">Today</td>
                        <td valign="top" style="padding:13px 0; color:#555B70;"><span style="color:#0F1222; font-weight:600;">{{step1}}</span></td>
                      </tr>
                      <tr>
                        <td class="when" width="132" valign="top" style="padding:13px 12px 13px 0; border-top:1px solid #EDEEF3; color:#0F1222; font-weight:600;">{{retry_date_label}}</td>
                        <td valign="top" style="padding:13px 0; border-top:1px solid #EDEEF3; color:#555B70;"><span style="color:#0F1222; font-weight:600;">{{retry_title}}.</span> {{retry_body}}</td>
                      </tr>
                      <tr>
                        <td class="when" width="132" valign="top" style="padding:13px 12px 0 0; border-top:1px solid #EDEEF3; color:#0F1222; font-weight:600;">{{step3_label}}</td>
                        <td valign="top" style="padding:13px 0 0; border-top:1px solid #EDEEF3; color:#555B70;"><span style="color:#0F1222; font-weight:600;">{{step3_title}}.</span> {{step3_body}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== Paused features ===== -->
          <tr>
            <td style="padding:16px 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF; border-radius:14px;">
                <tr>
                  <td class="px" style="padding:26px 32px 26px; font-family:${FONT};">
                    <p style="margin:0 0 14px; font-size:16px; font-weight:700; color:#0F1222; letter-spacing:-0.2px;">{{features_heading}}</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td class="tile" width="33%" valign="top" style="padding:0 6px 0 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F4FF" style="background-color:#F5F4FF; border-radius:10px;">
                            <tr><td style="padding:14px;">
                              <p style="margin:0; font-size:14px; font-weight:600; color:#0F1222;">AI price signals</p>
                              <p style="margin:3px 0 0; font-size:12px; line-height:17px; color:#6B7085;">PSA 10 grading insights</p>
                            </td></tr>
                          </table>
                        </td>
                        <td class="tile" width="33%" valign="top" style="padding:0 3px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F4FF" style="background-color:#F5F4FF; border-radius:10px;">
                            <tr><td style="padding:14px;">
                              <p style="margin:0; font-size:14px; font-weight:600; color:#0F1222;">Price alerts</p>
                              <p style="margin:3px 0 0; font-size:12px; line-height:17px; color:#6B7085;">On your watchlist</p>
                            </td></tr>
                          </table>
                        </td>
                        <td class="tile" width="33%" valign="top" style="padding:0 0 0 6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F5F4FF" style="background-color:#F5F4FF; border-radius:10px;">
                            <tr><td style="padding:14px;">
                              <p style="margin:0; font-size:14px; font-weight:600; color:#0F1222;">Scout AI</p>
                              <p style="margin:3px 0 0; font-size:12px; line-height:17px; color:#6B7085;">Assistant &amp; market data</p>
                            </td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== Help ===== -->
          <tr>
            <td class="px" style="padding:28px 40px 0; font-family:${FONT};">
              <p style="margin:0 0 6px; font-size:14px; font-weight:600; color:#0F1222;">Why was my payment declined?</p>
              <p style="margin:0; font-size:14px; line-height:22px; color:#555B70;">
                Usually an expired or replaced card, a changed billing address, or a security hold from your bank. If your card details are correct, ask your card issuer to approve the charge, then try again. Questions? Reply to this email or contact <a href="mailto:{{support_email}}" style="color:#4F46E5; text-decoration:none; font-weight:500;">{{support_email}}</a>.
              </p>
            </td>
          </tr>

          <!-- ===== Footer ===== -->
          <tr>
            <td class="px" style="padding:32px 40px 44px; font-family:${FONT};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #E2E4EC;">
                <tr>
                  <td style="padding-top:24px;">
                    <img src="{{logo_dark_url}}" width="110" height="27" alt="Card Tracker" style="width:110px; height:27px; opacity:0.85; color:#0F1222; font-size:14px; font-weight:700;">
                    <p style="margin:14px 0 8px; font-size:12px; line-height:20px; color:#8A8FA3;">
                      <a href="{{billing_settings_url}}" style="color:#555B70; text-decoration:none;">Manage billing</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="{{help_center_url}}" style="color:#555B70; text-decoration:none;">Support</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="{{terms_url}}" style="color:#555B70; text-decoration:none;">Terms</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="{{privacy_url}}" style="color:#555B70; text-decoration:none;">Privacy</a>
                    </p>
                    <p style="margin:0; font-size:12px; line-height:19px; color:#8A8FA3;">
                      Card Tracker will never ask for your full card number or password by email.<br>
                      Card Tracker, Inc. &middot; {{company_address}}<br>
                      You're receiving this billing notice about your Card Tracker Pro subscription.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
