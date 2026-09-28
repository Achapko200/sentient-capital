// TEMPORARY diagnostic — delete after the chart is fixed
import { getPlayer }          from "@/lib/players";
import { debugListingSearch } from "@/lib/ebay";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("cardId") ?? "";
  if (!/^\d{1,12}$/.test(id)) return Response.json({ error: "cardId required" }, { status: 400 });
  const player: any = await getPlayer(id);
  if (!player) return Response.json({ error: "player not found" }, { status: 404 });
  return Response.json(await debugListingSearch(player.cardName ?? player.name));
}
