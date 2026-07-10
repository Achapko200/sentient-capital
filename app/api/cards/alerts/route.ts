// ─── app/api/cards/alerts/route.ts ───────────────────────────────────────────
import { createAlert, getAlerts, deleteAlert } from "@/lib/alerts";
import { AlertSchema }                          from "@/lib/validators";
import { checkRateLimit }                       from "@/lib/ratelimit";

export async function GET(req: Request) {
  const limited = await checkRateLimit(req, "read");
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? "";

  if (!wallet.trim()) {
    return Response.json({ alerts: [] });
  }

  const alerts = await getAlerts(wallet);
  return Response.json({ alerts });
}

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "write");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AlertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { wallet, cardId, playerName, targetPrice, direction, email } = parsed.data;

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
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, wallet } = body as { id?: string; wallet?: string };

  if (!id || !wallet) {
    return Response.json({ error: "Missing id or wallet" }, { status: 400 });
  }

  if (!wallet.trim()) {
    return Response.json({ error: "Missing wallet" }, { status: 400 });
  }

  if (!/^alt_\d+$/.test(id)) {
    return Response.json({ error: "Invalid alert id" }, { status: 400 });
  }

  try {
    await deleteAlert(id, wallet);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}