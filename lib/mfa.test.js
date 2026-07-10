const test = require('node:test');
const assert = require('node:assert/strict');
const { generateSecret, generateTotp, verifyTotp } = require('./mfa.js');

test('generateSecret returns a base32 secret', () => {
  const secret = generateSecret();
  assert.match(secret, /^[A-Z2-7]+$/);
  assert.ok(secret.length >= 16);
});

test('generateTotp and verifyTotp work for a known secret', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const code = generateTotp(secret, 0);
  assert.equal(code, '282760');
  assert.equal(verifyTotp(secret, '282760', 0), true);
  assert.equal(verifyTotp(secret, '000000', 0), false);
});
