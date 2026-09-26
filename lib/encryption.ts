// AES-256-GCM Encryption for sensitive data at rest

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

async function getEncryptionKey(): Promise<CryptoKey> {
  const keyMaterial = process.env.ADMIN_SECRET_KEY ?? "default-32-char-key-change-this!!";
  const keyBytes    = new TextEncoder().encode(keyMaterial.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: ALGORITHM }, false, ["encrypt", "decrypt"]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key    = await getEncryptionKey();
  const iv     = crypto.getRandomValues(new Uint8Array(12));
  const data   = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, data);
  const result = new Uint8Array(iv.byteLength + cipher.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...result));
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key    = await getEncryptionKey();
  const data   = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv     = data.slice(0, 12);
  const cipher = data.slice(12);
  const plain  = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

// ── Encrypt sensitive fields before storing ───────────────────────────────────
export async function encryptPII(data: Record<string, any>, fields: string[]): Promise<Record<string, any>> {
  const result = { ...data };
  for (const field of fields) {
    if (result[field]) {
      result[field] = `enc:${await encrypt(String(result[field]))}`;
    }
  }
  return result;
}

export async function decryptPII(data: Record<string, any>, fields: string[]): Promise<Record<string, any>> {
  const result = { ...data };
  for (const field of fields) {
    if (result[field]?.startsWith?.("enc:")) {
      result[field] = await decrypt(result[field].slice(4));
    }
  }
  return result;
}
