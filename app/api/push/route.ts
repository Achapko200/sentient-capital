import webpush           from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-server';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: Request) {
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
    await webpush.sendNotification(
      JSON.parse(data.subscription),
      JSON.stringify({ title, body, url: url ?? '/app' })
    );
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
