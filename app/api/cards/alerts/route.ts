import { createAlert, getAlerts, deleteAlert } from "@/lib/alerts";
import { AlertSchema }                          from "@/lib/validators";
import { checkRateLimit }                       from "@/lib/ratelimit";
import { createClient }                         from "@supabase/supabase-js";

function getUserClient(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? "";
  if (!wallet.trim()) return Response.json({ alerts: [] });

  const alerts = await getAlerts(wallet);
  return Response.json({ alerts });
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = AlertSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { wallet, cardId, playerName, targetPrice, direction, email } = parsed.data;

  // Verify the session matches the wallet
  const userClient = getUserClient(req);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Make sure the wallet belongs to this user
  const expectedWallet = `email:${user.email}`;
  if (wallet !== expectedWallet && wallet !== user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alert = await createAlert(wallet, cardId, playerName, targetPrice, direction, email ?? undefined);
    return Response.json({ alert });
  } catch {
    return Response.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, wallet } = body as { id?: string; wallet?: string };
  if (!id || !wallet) return Response.json({ error: "Missing fields" }, { status: 400 });

  // Verify session
  const userClient = getUserClient(req);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const expectedWallet = `email:${user.email}`;
  if (wallet !== expectedWallet && wallet !== user.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteAlert(id, wallet);
  return Response.json({ ok: true });
}
