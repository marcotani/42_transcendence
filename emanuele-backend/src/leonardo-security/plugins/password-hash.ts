import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { Buffer } from 'buffer';

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const hashToVerify = pbkdf2Sync(password, salt, 10000, 64, 'sha512');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (hashBuffer.length !== hashToVerify.length) return false;
  return timingSafeEqual(hashBuffer, hashToVerify);
}