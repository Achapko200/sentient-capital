// OAuth 2.0 PKCE (Proof Key for Code Exchange)
// Prevents authorization code interception attacks

export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array    = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const encoder   = new TextEncoder();
  const data      = encoder.encode(verifier);
  const digest    = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return { verifier, challenge };
}

export async function verifyPKCE(verifier: string, challenge: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data    = encoder.encode(verifier);
  const digest  = await crypto.subtle.digest("SHA-256", data);
  const computed = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return computed === challenge;
}
