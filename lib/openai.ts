// ─── lib/openai.ts ────────────────────────────────────────────────────────────
// Only used server-side (API routes). Never import in client components.

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});
