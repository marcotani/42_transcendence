import { createHmac } from 'crypto';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function generateJWT(payload: object, secret: string, expiresInSec = 86400): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(body));
  const data = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

export function verifyJWT(token: string, secret: string): object | null {
  const [headerB64, payloadB64, signature] = token.split('.');
  if (!headerB64 || !payloadB64 || !signature)
    return null;
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expectedSig !== signature)
    return null;
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  if (payload.exp && Date.now() / 1000 > payload.exp)
    return null;
  return payload;
}
