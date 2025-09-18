import { randomBytes } from 'crypto';

// Generate a random base32 secret for 2FA
export function generate2FASecret(): string {
  const buffer = randomBytes(20);
  return buffer.toString('base64').replace(/[^A-Z2-7]/gi, '').slice(0, 32);
}
