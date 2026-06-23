// ─── app/api/cards/listings/[id]/sold/route.ts ───────────────────────────────
import { markSold } from "@/lib/listings";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id }     = await context.params;
  const { txHash } = await req.json();
  await markSold(id, txHash ?? "");
  return Response.json({ success: true });
}