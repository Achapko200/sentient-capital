import { audit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, "search");
  if (limited) return limited;
  try {
    const body = await req.json();
    await audit("SUSPICIOUS_REQUEST", null, {
      type:   "csp_violation",
      report: body["csp-report"] ?? body,
    }, req);
  } catch {}
  return new Response(null, { status: 204 });
}
