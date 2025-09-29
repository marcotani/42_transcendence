import { randomBytes, createHmac, timingSafeEqual} from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function bufferToBase32(buffer: Buffer): string
{
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++)
  {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5)
    {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0)
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32ToBuffer(base32: string): Buffer
{
  let bits = 0, value = 0, index = 0;
  const output = [];
  base32 = base32.replace(/=+$/, '').toUpperCase();
  for (let i = 0; i < base32.length; i++)
  {
    const idx = BASE32_ALPHABET.indexOf(base32[i]);
    if (idx === -1)
      continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8)
    {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

// Generate a random base32 secret for 2FA (default 32 chars)
export function generate2FASecret(length: number = 32): string
{
  // Each base32 char encodes 5 bits, so need ceil(length * 5 / 8) bytes
  const neededBytes = Math.ceil(length * 5 / 8);
  const buffer = randomBytes(neededBytes);
  let secret = bufferToBase32(buffer);
  if (secret.length < length)
  {
    while (secret.length < length)
      secret += BASE32_ALPHABET[Math.floor(Math.random() * 32)];
  }
  else if (secret.length > length)
    secret = secret.slice(0, length);
  return secret;
}

// Generate TOTP code for a given secret and time step
export function generateTOTP(secret: string, timeStep?: number): string
{
  if (typeof timeStep === 'undefined')
    timeStep = Math.floor(Date.now() / 1000 / 30);
  const key = base32ToBuffer(secret);
  const msg = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--)
  {
    msg[i] = timeStep & 0xff;
    timeStep = timeStep >> 8;
  }
  const hmac = createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

// Verify a user-provided TOTP code (allowing ±1 time step for clock drift)
export function verifyTOTP(secret: string, code: string): boolean
{
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  for (let errorWindow = -1; errorWindow <= 1; errorWindow++) {
    const generated = generateTOTP(secret, timeStep + errorWindow);
    // Only use timingSafeEqual if lengths match, otherwise fallback to string comparison
    if (generated.length === code.length) {
      const a = Buffer.from(generated);
      const b = Buffer.from(code);
      if (timingSafeEqual(a, b)) return true;
    } else {
      if (generated === code) return true;
    }
  }
  return false;
}