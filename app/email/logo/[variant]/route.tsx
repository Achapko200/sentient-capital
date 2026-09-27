// app/email/logo/[variant]/route.tsx
// Serves the Card Tracker email logo as a PNG: /email/logo/white and /email/logo/dark
import { ImageResponse } from "next/og";

export const runtime = "edge";

async function loadInterBold(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120 Safari/537.36" },
    }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  const textColor = variant === "dark" ? "#101828" : "#FFFFFF";
  const inter = await loadInterBold();

  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", width: "100%", height: "100%", background: "transparent" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 22,
            backgroundImage: "linear-gradient(135deg, #3D7BFF 0%, #8B4DFF 100%)",
          }}
        >
          <svg width="88" height="88" viewBox="0 0 44 44">
            <rect x="13" y="9" width="18" height="26" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2.4" />
            <path
              d="M16.5 26.5 L20.5 21.5 L23.5 24 L27.5 17.5"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 28,
            fontSize: 50,
            fontWeight: 700,
            letterSpacing: -1.2,
            color: textColor,
            fontFamily: inter ? "Inter" : "sans-serif",
          }}
        >
          Card Tracker
        </div>
      </div>
    ),
    {
      width: 424,
      height: 104,
      fonts: inter ? [{ name: "Inter", data: inter, weight: 700, style: "normal" }] : undefined,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
