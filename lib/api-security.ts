// API Security — versioning, deprecation, schema validation

import { z } from "zod";

// ── API Version Control ───────────────────────────────────────────────────────
export function checkAPIVersion(req: Request): { valid: boolean; version: string } {
  const version = req.headers.get("x-api-version") ?? "1";
  const supported = ["1", "2"];
  return { valid: supported.includes(version), version };
}

// ── Request Schema Validation ─────────────────────────────────────────────────
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
  };
}

// ── Response Signing ──────────────────────────────────────────────────────────
export async function signResponse(data: any, secret: string): Promise<{
  data: any;
  signature: string;
  timestamp: number;
}> {
  const timestamp = Date.now();
  const payload   = JSON.stringify({ data, timestamp });
  const encoder   = new TextEncoder();
  const keyData   = encoder.encode(secret);
  const msgData   = encoder.encode(payload);
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig       = await crypto.subtle.sign("HMAC", key, msgData);
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return { data, signature, timestamp };
}

// ── Idempotency ───────────────────────────────────────────────────────────────
import { Redis } from "@upstash/redis";
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkIdempotency(key: string, ttl = 86400): Promise<{
  isDuplicate: boolean;
  cachedResponse?: any;
}> {
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) return { isDuplicate: true, cachedResponse: cached };
  return { isDuplicate: false };
}

export async function storeIdempotencyResult(key: string, response: any, ttl = 86400) {
  await redis.set(`idempotency:${key}`, JSON.stringify(response), { ex: ttl });
}
