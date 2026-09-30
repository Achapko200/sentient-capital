// Player photo: MLB headshot when one exists, otherwise an initials avatar in team colors.
import { getPlayer } from "@/lib/players";

const CACHE = "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d{1,8}$/.test(id)) return new Response("Bad request", { status: 400 });

  // No default image in the URL, so MLB returns 404 when it has no photo
  try {
    const r = await fetch(`https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best,f_png/v1/people/${id}/headshot/67/current`,
      { next: { revalidate: 604800 } });
    const type = r.headers.get("content-type") ?? "";
    if (r.ok && type.startsWith("image/")) {
      return new Response(await r.arrayBuffer(), { headers: { "Content-Type": type, "Cache-Control": CACHE } });
    }
  } catch {}

  // Fallback: initials in team colors
  const p = await getPlayer(id).catch(() => null);
  const letters = (p?.name ?? "")
    .replace(/[^A-Za-z\s]/g, " ").trim().split(/\s+/).filter(w => !/^(jr|sr|ii|iii|iv)$/i.test(w));
  const initials = ((letters[0]?.[0] ?? "") + (letters.length > 1 ? letters[letters.length - 1][0] : "")).toUpperCase() || "?";
  const bg = /^#[0-9a-f]{6}$/i.test(p?.cardColor ?? "") ? p!.cardColor : "#1E1A4D";
  const ring = /^#[0-9a-f]{6}$/i.test(p?.teamColor ?? "") ? p!.teamColor : "#3D7BFF";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="213" height="213" viewBox="0 0 213 213">
  <rect width="213" height="213" fill="${bg}"/>
  <circle cx="106.5" cy="106.5" r="98" fill="none" stroke="${ring}" stroke-width="6" opacity="0.55"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="84" font-weight="700" fill="#FFFFFF">${initials}</text>
</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": CACHE } });
}
