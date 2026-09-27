import Stripe from "stripe";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const getEnv = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim().replace(/^["']|["']$/g, "");
const key = process.env.STRIPE_KEY ?? env.match(/sk_test_[A-Za-z0-9]+/)?.[0];
const resendKey = getEnv("RESEND_API_KEY");
if (!key) { console.log("No sk_test_ key in .env.local"); process.exit(1); }
const stripe = new Stripe(key);
const EMAIL = "anna.chapko.2004@gmail.com";
const fmt = (t?: number | null) => (t ? new Date(t * 1000).toLocaleString("en-US", { timeZone: "America/New_York" }) : "none");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// 0. Make sure the webhook listens for invoice.payment_failed
const hook = (await stripe.webhookEndpoints.list({ limit: 20 })).data.find(h => h.url.includes("/api/stripe/webhook"));
if (!hook) { console.log("❌ No test-mode webhook for /api/stripe/webhook"); process.exit(1); }
if (!hook.enabled_events.includes("*") && !hook.enabled_events.includes("invoice.payment_failed")) {
  const events = Array.from(new Set([...hook.enabled_events, "invoice.payment_failed"])) as any;
  await stripe.webhookEndpoints.update(hook.id, { enabled_events: events });
  console.log("✅ Subscribed webhook to invoice.payment_failed");
} else console.log("✅ Webhook already listens for invoice.payment_failed");

// Resend: find a payment-failed email sent to EMAIL after a given time
async function findEmail(afterMs: number): Promise<string> {
  if (!resendKey) return "can't check (no RESEND_API_KEY)";
  for (let i = 0; i < 15; i++) {
    const r = await fetch("https://api.resend.com/emails?limit=20", { headers: { Authorization: `Bearer ${resendKey}` } });
    if (!r.ok) return `can't check via API (${r.status}) - look in your inbox`;
    const list = ((await r.json()) as any).data ?? [];
    const hit = list.find((e: any) => [].concat(e.to).includes(EMAIL as never) && /payment failed|canceled/i.test(e.subject) && new Date(e.created_at).getTime() > afterMs);
    if (hit) return `sent ✅ (${hit.last_event ?? "sent"})`;
    await sleep(3000);
  }
  return "NOT sent ❌";
}

// 1. Test clock + customer with a card that always declines
let now = Math.floor(Date.now() / 1000);
const clock = await stripe.testHelpers.testClocks.create({ frozen_time: now, name: "payment-failed test" });
const customer = await stripe.customers.create({ email: EMAIL, name: "Anna Chapko", test_clock: clock.id });
const pm = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: customer.id });
await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } });
const product = await stripe.products.create({ name: "Card Tracker Pro (TEST)" });
const sub = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price_data: { currency: "usd", product: product.id, unit_amount: 999, recurring: { interval: "month" } } }],
  trial_period_days: 1,
});
console.log(`Created test subscription ${sub.id}\n`);

async function advanceTo(t: number) {
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: t });
  for (let i = 0; i < 90; i++) {
    if ((await stripe.testHelpers.testClocks.retrieve(clock.id)).status === "ready") { now = t; return; }
    await sleep(2000);
  }
  throw new Error("test clock did not finish advancing");
}

// 2. Renewal + every retry
let target = now + 26 * 3600, lastAttempt = 0, sent = 0;
for (let step = 0; step < 20; step++) {
  const before = Date.now();
  await advanceTo(target);
  const inv = (await stripe.invoices.list({ customer: customer.id, limit: 5 })).data.find(i => i.amount_due > 0);
  if (!inv || inv.attempt_count === 0) { target = now + 6 * 3600; continue; }

  if (inv.attempt_count !== lastAttempt) {
    lastAttempt = inv.attempt_count;
    let delivery = "no event ❌";
    for (let i = 0; i < 15; i++) {
      const ev = (await stripe.events.list({ type: "invoice.payment_failed", limit: 20 })).data
        .find(e => (e.data.object as any).id === inv.id && (e.data.object as any).attempt_count === inv.attempt_count);
      if (ev) { delivery = ev.pending_webhooks === 0 ? "delivered ✅" : "FAILED/retrying ❌ (see Stripe > Webhooks > your endpoint for the error)"; if (ev.pending_webhooks === 0) break; }
      await sleep(3000);
    }
    const email = await findEmail(before - 5000);
    if (email.startsWith("sent")) sent++;
    const s = await stripe.subscriptions.retrieve(sub.id);
    console.log(`Attempt ${inv.attempt_count}: sub ${s.status}, next retry ${fmt(inv.next_payment_attempt)}\n   webhook ${delivery}\n   email   ${email}`);
  }

  if (!inv.next_payment_attempt || inv.status !== "open") {
    await advanceTo(now + 3600);
    const final = await stripe.subscriptions.retrieve(sub.id);
    console.log(`\nRESULT: ${inv.attempt_count} attempts, ${sent} emails confirmed sent, final subscription status: ${final.status}`);
    console.log(`Email should say ${inv.attempt_count} attempts and end with '${final.status}'.`);
    break;
  }
  target = Math.max(inv.next_payment_attempt, now) + 3600;
}

await stripe.testHelpers.testClocks.del(clock.id);
await stripe.products.update(product.id, { active: false });
console.log("\nTest data cleaned up.");
