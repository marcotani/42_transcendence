import { randomBytes } from 'crypto';

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
