// Data Loss Prevention (DLP)
// Detect and block sensitive data from leaving the platform

// ── Sensitive Data Patterns ───────────────────────────────────────────────────
const PATTERNS = {
  creditCard:   /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ssn:          /\b\d{3}-?\d{2}-?\d{4}\b/g,
  apiKey:       /\b[A-Za-z0-9]{32,45}\b/g,
  jwt:          /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  privateKey:   /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g,
  awsKey:       /AKIA[0-9A-Z]{16}/g,
  stripeKey:    /sk_(?:live|test)_[A-Za-z0-9]{24,}/g,
  supabaseKey:  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+/g,
  credential:  /\b(?:password|passwd|passphrase|seed phrase|recovery phrase|private key|secret key|access token|api key)\b\s*(?:is\s+|[:=]\s*)\S+(?:\s+\S+){0,23}/gi,
};

export function scanForSensitiveData(text: string): {
  found:   boolean;
  types:   string[];
  redacted: string;
} {
  const types:   string[] = [];
  let redacted = text;

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(text)) {
      types.push(type);
      redacted = redacted.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
      pattern.lastIndex = 0;
    }
  }

  return { found: types.length > 0, types, redacted };
}

// ── Scan AI responses before returning ───────────────────────────────────────
export function sanitizeAIResponse(response: string): string {
  const { found, redacted } = scanForSensitiveData(response);
  if (found) console.warn("[DLP] Sensitive data detected in AI response, redacted");
  return redacted;
}

// ── Scan user inputs ──────────────────────────────────────────────────────────
export function validateUserInput(input: string): { safe: boolean; reason?: string } {
  const { found, types } = scanForSensitiveData(input);
  if (found) return { safe: false, reason: `Contains sensitive data: ${types.join(", ")}` };

  // Max length
  if (input.length > 10000) return { safe: false, reason: "Input too long" };

  // Null bytes
  if (/\x00/.test(input)) return { safe: false, reason: "Invalid characters" };

  return { safe: true };
}
