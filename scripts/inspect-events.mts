import Stripe from "stripe";
import { readFileSync } from "fs";
const key = readFileSync(".env.local", "utf8").match(/sk_test_[A-Za-z0-9]+/)?.[0]!;
const stripe = new Stripe(key);

const del = (await stripe.events.list({ type: "customer.subscription.deleted", limit: 1 })).data[0];
if (del) {
  const sub = del.data.object as any;
  console.log("subscription.deleted:", {
    sub: sub.id, status: sub.status,
    reason: sub.cancellation_details?.reason, latest_invoice: sub.latest_invoice,
    still_pending_delivery: del.pending_webhooks,
  });
} else console.log("no subscription.deleted event found");

const fails = (await stripe.events.list({ type: "invoice.payment_failed", limit: 3 })).data;
for (const e of fails) {
  const inv = e.data.object as any;
  console.log("payment_failed:", { attempt: inv.attempt_count, next_payment_attempt: inv.next_payment_attempt, status: inv.status, customer_email: inv.customer_email });
}
