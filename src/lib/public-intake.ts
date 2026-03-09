import crypto from 'crypto';

export type PublicClientConfig = {
  organizationId?: string;
  createdBy?: string;
};

type IntakeTokenPayload = {
  slug: string;
  exp: number;
};

const base64UrlEncode = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, 'base64url').toString('utf8');

const getSecret = (): string => {
  const secret = process.env.PUBLIC_INTAKE_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing PUBLIC_INTAKE_SECRET (or JWT_SECRET fallback)');
  }
  return secret;
};

export const createIntakeToken = (slug: string, expiresAtUnix: number): string => {
  const payload: IntakeTokenPayload = { slug, exp: expiresAtUnix };
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
};

export const verifyIntakeToken = (
  token: string | null,
  expectedSlug: string
): { valid: boolean; reason?: string } => {
  if (!token) {
    return { valid: false, reason: 'Missing token' };
  }

  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) {
    return { valid: false, reason: 'Invalid token format' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', getSecret())
    .update(payloadEncoded)
    .digest('base64url');

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { valid: false, reason: 'Invalid token signature' };
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payloadEncoded)) as IntakeTokenPayload;
    if (decoded.slug !== expectedSlug) {
      return { valid: false, reason: 'Token slug mismatch' };
    }
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'Token expired' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: 'Invalid token payload' };
  }
};

export const getPublicClientConfig = (clientSlug: string): PublicClientConfig | null => {
  const raw = process.env.PUBLIC_INTAKE_CLIENTS;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, PublicClientConfig>;
    return parsed[clientSlug] || null;
  } catch {
    return null;
  }
};
