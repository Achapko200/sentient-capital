import crypto from "crypto";

export function generateSecret(length = 20): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let i = 0; i < length; i += 1) {
    secret += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return secret;
}

function decodeBase32(input: string): Buffer {
  const cleaned = input.replace(/=+$/g, "").toUpperCase();
  let bits = "";
  const lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  for (const char of cleaned) {
    const value = lookup.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 7 < bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotp(secret: string, timeStep = Math.floor(Date.now() / 1000 / 30)): string {
  const key = decodeBase32(secret);
  const counter = Buffer.alloc(8);
  const value = Math.max(0, Math.floor(timeStep));
  counter.writeUInt32BE(0, 0);
  counter.writeUInt32BE(value, 4);

  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, "0");
}

export function verifyTotp(secret: string, code: string, timeStep = Math.floor(Date.now() / 1000 / 30)): boolean {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) return false;

  const current = generateTotp(secret, timeStep);
  const previous = generateTotp(secret, timeStep - 1);
  const next = generateTotp(secret, timeStep + 1);

  return [current, previous, next].includes(normalized);
}
