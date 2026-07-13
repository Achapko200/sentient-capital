import { supabaseAdmin } from '@/lib/supabase-server';

const vapidEmail     = process.env.VAPID_EMAIL!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

async function sendPushNotification(subscription: any, payload: string) {
  const { endpoint, keys } = subscription;
  const { p256dh, auth }   = keys;

  const webpush = await import('web-push');
  webpush.default.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
  return webpush.default.sendNotification(subscription, payload);
}

export async function POST(req: Request) {
  try {
    const { action, subscription, userId, title, body, url } = await req.json();

    if (action === 'subscribe') {
      await supabaseAdmin.from('push_subscriptions').upsert({
        user_id:      userId,
        subscription: JSON.stringify(subscription),
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id' });
      return Response.json({ success: true });
    }

    if (action === 'notify') {
      const { data } = await supabaseAdmin
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', userId)
        .single();
      if (!data) return Response.json({ error: 'No subscription' }, { status: 404 });
      await sendPushNotification(
        JSON.parse(data.subscription),
        JSON.stringify({ title, body, url: url ?? '/app' })
      );
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Push error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
