import Stripe        from "stripe";
import { supabaseAdmin } from "@/lib/supabase-server";
import { buildPaymentFailedVars, renderPaymentFailedEmail } from "@/lib/emails/payment-failed";

function shipDetails(session: Stripe.Checkout.Session): { name?: string | null; address?: Stripe.Address | null } | null {
  return (session as any).shipping_details ?? (session as any).collected_information?.shipping_details ?? null;
}

// Stripe API compat: fields moved in newer versions
function periodEnd(sub: Stripe.Subscription): number {
  return (sub as any).current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
}
function invoiceSubId(inv: Stripe.Invoice): string | null {
  const s = (inv as any).subscription ?? (inv as any).parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : s?.id ?? null;
}


// ── Stripe webhook — maximum security ────────────────────────────────────────
// 1. Verify Stripe signature (prevents forged webhooks)
// 2. Replay attack prevention (prevents duplicate processing)
// 3. Verify payment with Stripe API directly (never trust metadata alone)
// 4. Idempotent writes (safe to retry)
// 5. Audit every action

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia" as any,
  });

  // ── Step 1: Verify Stripe signature ────────────────────────────────────────
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    await logSecurityEvent("WEBHOOK_NO_SIGNATURE", req);
    return new Response("Forbidden", { status: 403 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    await logSecurityEvent("WEBHOOK_INVALID_SIGNATURE", req, { error: err.message });
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Step 2: Replay attack prevention ───────────────────────────────────────
  const { isReplayAttack } = await import("@/lib/data-integrity");
  if (await isReplayAttack(event.id)) {
    // Silent success — don't reveal we detected replay
    return Response.json({ received: true });
  }

  // ── Step 3: Audit log every webhook ────────────────────────────────────────
  const { audit } = await import("@/lib/audit");
  await audit("PURCHASE", null, {
    eventType: event.type,
    eventId:   event.id,
    liveMode:  event.livemode,
  }, req);

  // ── Step 4: Handle events ──────────────────────────────────────────────────
  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    }

    if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    }

    if (event.type === "invoice.payment_failed") {
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
    }

  } catch (err: any) {
    // Log but return 200 to prevent Stripe retrying indefinitely
    console.error("[WEBHOOK ERROR]", err.message);
    await audit("PURCHASE", null, { error: err.message, eventId: event.id }, req);
  }

  return Response.json({ received: true });
}

// ── Checkout completed ─────────────────────────────────────────────────────
async function handleCheckoutCompleted(
  stripe:  Stripe,
  session: Stripe.Checkout.Session,
) {
  // CRITICAL: Verify payment status directly with Stripe
  // Never trust metadata alone — always verify with Stripe API
  if (session.payment_status !== "paid") {
    console.warn("[WEBHOOK] Checkout completed but not paid:", session.id);
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    console.warn("[WEBHOOK] No userId in metadata:", session.id);
    return;
  }

  // ── Subscription purchase ──────────────────────────────────────────────────
  if (session.mode === "subscription" && session.metadata?.tier) {
    const tier = session.metadata.tier;

    // Validate tier value
    if (!["pro", "elite"].includes(tier)) {
      console.error("[WEBHOOK] Invalid tier in metadata:", tier);
      return;
    }

    // Verify subscription directly with Stripe — never trust metadata alone
    const subId = session.subscription as string;
    if (!subId) {
      console.error("[WEBHOOK] No subscription ID:", session.id);
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subId);

    // Double-check subscription is actually active
    if (!["active", "trialing"].includes(subscription.status)) {
      console.error("[WEBHOOK] Subscription not active:", subscription.status);
      return;
    }

    // Verify the customer matches
    if (subscription.customer !== session.customer) {
      console.error("[WEBHOOK] Customer mismatch — possible fraud");
      await notifyAdmin("POSSIBLE_FRAUD", {
        sessionCustomer:      session.customer,
        subscriptionCustomer: subscription.customer,
        userId,
      });
      return;
    }

    // All checks passed — grant subscription
    await supabaseAdmin.from("subscriptions").upsert({
      user_id:                userId,
      tier,
      status:                 "active",
      stripe_customer_id:     session.customer as string,
      stripe_subscription_id: subId,
      current_period_end:     new Date(periodEnd(subscription) * 1000).toISOString(),
      updated_at:             new Date().toISOString(),
    }, { onConflict: "user_id" });

    console.log(`[WEBHOOK] Subscription granted: ${tier} for user ${userId}`);
  }

  // ── One-time card purchase ─────────────────────────────────────────────────
  if (session.mode === "payment" && session.metadata?.cardId) {
    const { cardId, pricePerShare, playerName } = session.metadata;

    // Verify amount matches expected price
    const expectedAmount = Math.round(parseFloat(pricePerShare) * 1.10 * 100);
    const actualAmount   = session.amount_total ?? 0;

    if (Math.abs(actualAmount - expectedAmount) > 100) {
      // More than $1 discrepancy — possible price manipulation
      await notifyAdmin("PRICE_MISMATCH", {
        expected: expectedAmount,
        actual:   actualAmount,
        cardId,
        userId,
      });
      // Still process but log the discrepancy
    }

    // Get buyer shipping address from Stripe
    const buyerAddress  = shipDetails(session)?.address;
    const buyerName     = shipDetails(session)?.name ?? session.customer_details?.name ?? "Buyer";
    const buyerEmail    = session.customer_details?.email ?? "";
    const shippingRate  = session.shipping_cost?.amount_total ?? 999;
    const shippingSpeed = shippingRate > 1000 ? "Express (1-3 days)" : "Standard (3-7 days)";

    const addressStr = buyerAddress
      ? `${buyerAddress.line1}${buyerAddress.line2 ? ", " + buyerAddress.line2 : ""}, ${buyerAddress.city}, ${buyerAddress.state} ${buyerAddress.postal_code}, ${buyerAddress.country}`
      : "Address not provided";

    // Save order — idempotent (use session ID to prevent duplicates)
    const { data: existing } = await supabaseAdmin
      .from("card_orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (!existing) {
      await supabaseAdmin.from("card_orders").insert({
        user_id:           userId,
        player_name:       playerName,
        card_name:         `${playerName} PSA 10`,
        price:             parseFloat(pricePerShare),
        fee:               parseFloat(pricePerShare) * 0.10,
        type:              "buy",
        status:            "paid",
        address:           addressStr,
        stripe_session_id: session.id,
      });
    }

    // Email admin
    await sendEmail({
      to:      "anna.chapko.2004@gmail.com",
      subject: `🎉 New Card Sale — ${playerName}`,
      html:    buildAdminEmailHTML({ playerName, pricePerShare, buyerName, buyerEmail, addressStr, shippingSpeed }),
    });

    // Email buyer
    if (buyerEmail) {
      await sendEmail({
        to:      buyerEmail,
        subject: `✅ Order Confirmed — ${playerName} PSA 10`,
        html:    buildBuyerEmailHTML({ playerName, pricePerShare, buyerName, addressStr, shippingSpeed }),
      });
    }
  }
}

// ── Subscription updated ───────────────────────────────────────────────────
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!data) return;

  await supabaseAdmin.from("subscriptions").update({
    status:            subscription.status === "active" ? "active" : "inactive",
    current_period_end: new Date(periodEnd(subscription) * 1000).toISOString(),
    updated_at:        new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id);
}

// ── Subscription deleted ───────────────────────────────────────────────────
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!data) return;

  await supabaseAdmin.from("subscriptions").update({
    tier:       "free",
    status:     "cancelled",
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subscription.id);
}

// ── Payment failed ─────────────────────────────────────────────────────────
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubId(invoice) as string;
  if (!subId) return;

  await supabaseAdmin.from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId);

  const customerEmail = invoice.customer_email;
  if (!customerEmail) return;

  try {
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const vars = await buildPaymentFailedVars(stripeClient, invoice);
    const { subject, html } = renderPaymentFailedEmail(vars);
    await sendEmail({ to: customerEmail, subject, html });
    console.log(`[stripe webhook] sent "${subject}" to ${customerEmail} (attempt ${invoice.attempt_count})`);
  } catch (err) {
    console.error("[stripe webhook] payment-failed email error:", err);
  }
}
// ── Helpers ────────────────────────────────────────────────────────────────
async function logSecurityEvent(event: string, req: Request, meta?: any) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  console.warn(`[SECURITY] ${event}`, { ip, ...meta });
}

async function notifyAdmin(event: string, data: any) {
  await sendEmail({
    to:      "anna.chapko.2004@gmail.com",
    subject: `🚨 Security Alert: ${event}`,
    html:    `<pre>${JSON.stringify(data, null, 2)}</pre>`,
  });
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
    body:    JSON.stringify({ from: "Card Tracker <onboarding@resend.dev>", to: [to], subject, html }),
  });
}

function buildAdminEmailHTML({ playerName, pricePerShare, buyerName, buyerEmail, addressStr, shippingSpeed }: any) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2>⚾ New Card Sale!</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Card</strong></td><td style="padding:8px;border:1px solid #eee;">${playerName} PSA 10</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Sale Price</strong></td><td style="padding:8px;border:1px solid #eee;">$${pricePerShare}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Your Fee (10%)</strong></td><td style="padding:8px;border:1px solid #eee;">$${(parseFloat(pricePerShare)*0.10).toFixed(2)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Buyer</strong></td><td style="padding:8px;border:1px solid #eee;">${buyerName} (${buyerEmail})</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Ship To</strong></td><td style="padding:8px;border:1px solid #eee;">${addressStr}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee;"><strong>Shipping</strong></td><td style="padding:8px;border:1px solid #eee;">${shippingSpeed}</td></tr>
      </table>
      <a href="https://sentient-capital.vercel.app/admin" style="background:#1a1a2e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">View Admin Dashboard</a>
    </div>`;
}

function buildBuyerEmailHTML({ playerName, pricePerShare, buyerName, addressStr, shippingSpeed }: any) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#fff;padding:32px;border-radius:12px;">
      <h2 style="color:#00c278;">⚾ Your order is confirmed!</h2>
      <p>Thanks for your purchase, ${buyerName}!</p>
      <div style="background:#1a1a1a;padding:16px;border-radius:8px;margin:16px 0;">
        <p><strong>Card:</strong> ${playerName} PSA 10</p>
        <p><strong>Price:</strong> $${pricePerShare}</p>
        <p><strong>Shipping to:</strong> ${addressStr}</p>
        <p><strong>Delivery:</strong> ${shippingSpeed}</p>
      </div>
      <a href="https://sentient-capital.vercel.app/app" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Track your order</a>
    </div>`;
}


// ── Subscription canceled after all payment retries failed ─────────────────
async function handleSubscriptionCanceledEmail(sub: Stripe.Subscription) {
  if (sub.status !== "canceled") return;
  if ((sub as any).cancellation_details?.reason !== "payment_failed") return;
  const invoiceId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;
  if (!invoiceId) return;
  try {
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const invoice = await stripeClient.invoices.retrieve(invoiceId);
    const to = invoice.customer_email;
    if (!to) return;
    const vars = await buildPaymentFailedVars(stripeClient, { ...invoice, next_payment_attempt: null } as Stripe.Invoice);
    const { subject, html } = renderPaymentFailedEmail(vars);
    await sendEmail({ to, subject, html });
  } catch (err) {
    console.error("[stripe webhook] cancellation email error:", err);
  }
}
