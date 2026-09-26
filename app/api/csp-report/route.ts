import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await audit("SUSPICIOUS_REQUEST", null, {
      type:   "csp_violation",
      report: body["csp-report"] ?? body,
    }, req);
  } catch {}
  return new Response(null, { status: 204 });
}
