// ─── app/api/cards/alerts/route.ts ───────────────────────────────────────────
import { createAlert, getAlerts, deleteAlert } from "@/lib/alerts";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") ?? "";
  const alerts = await getAlerts(wallet);
  return Response.json({ alerts });
}

export async function POST(req: Request) {
  const { wallet, cardId, playerName, targetPrice, direction, email } = await req.json();
  const alert = await createAlert(wallet, cardId, playerName, targetPrice, direction, email);
  return Response.json({ alert });
}

export async function DELETE(req: Request) {
  const { id, wallet } = await req.json();
  await deleteAlert(id, wallet);
  return Response.json({ success: true });
}