import { buildPaymentFailedVars, renderPaymentFailedEmail } from "../lib/emails/payment-failed";

const stripe: any = { paymentMethods: { list: async () => ({ data: [{ card: { brand: "visa", last4: "4242" } }] }) } };
const invoice: any = {
  customer: "cus_test", customer_name: "Anna Chapko", amount_due: 999, currency: "usd", due_date: null,
  hosted_invoice_url: "https://sentient-capital.vercel.app/pricing",
  lines: { data: [{ period: { start: Math.floor(Date.now() / 1000) - 2592000, end: Math.floor(Date.now() / 1000) } }] },
  number: "CT-TEST-0001", next_payment_attempt: Math.floor(Date.now() / 1000) + 3 * 86400,
};

const { subject, html, text } = renderPaymentFailedEmail(await buildPaymentFailedVars(stripe, invoice));

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Card Tracker <onboarding@resend.dev>", to: ["anna.chapko.2004@gmail.com"], subject, html, text }),
});
console.log(res.status, await res.text());
