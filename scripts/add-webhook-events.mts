import Stripe from "stripe";
import { readFileSync } from "fs";
const key = readFileSync(".env.local", "utf8").match(/sk_test_[A-Za-z0-9]+/)?.[0];
if (!key) throw new Error("no sk_test_ key in .env.local");
const stripe = new Stripe(key);
const hook = (await stripe.webhookEndpoints.list({ limit: 20 })).data.find(h => h.url.includes("/api/stripe/webhook"));
if (!hook) throw new Error("webhook endpoint not found");
if (hook.enabled_events.includes("*")) { console.log("Webhook already receives all events"); process.exit(0); }
const events = Array.from(new Set([...hook.enabled_events, "invoice.payment_failed", "customer.subscription.deleted"])) as Stripe.WebhookEndpointUpdateParams.EnabledEvent[];
await stripe.webhookEndpoints.update(hook.id, { enabled_events: events });
console.log("Webhook now listens for:", events.join(", "));
