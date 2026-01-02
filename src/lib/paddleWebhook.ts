import { createHmac, timingSafeEqual } from 'crypto';

type PaddleSignatureParts = {
  ts: string;
  h1: string[];
};

function parsePaddleSignatureHeader(header: string): PaddleSignatureParts | null {
  const parts = header
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);

  const parsed: Record<string, string[]> = {};

  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (!key || rest.length === 0) continue;
    const value = rest.join('=');
    const k = key.trim();
    const v = value.trim();
    if (!k || !v) continue;
    if (!parsed[k]) parsed[k] = [];
    parsed[k].push(v);
  }

  const ts = parsed.ts?.[0];
  const h1 = parsed.h1 || [];

  if (!ts || h1.length === 0) return null;
  return { ts, h1 };
}

export function verifyPaddleWebhookSignature(options: {
  rawBody: string;
  signatureHeader: string;
  secret: string;
  toleranceSeconds?: number;
}): { ok: true } | { ok: false; reason: string } {
  const { rawBody, signatureHeader, secret, toleranceSeconds = 300 } = options;

  if (!signatureHeader) return { ok: false, reason: 'Missing Paddle-Signature header' };
  if (!secret) return { ok: false, reason: 'Missing webhook secret' };

  const parsed = parsePaddleSignatureHeader(signatureHeader);
  if (!parsed) return { ok: false, reason: 'Invalid Paddle-Signature header format' };

  const tsNum = Number(parsed.ts);
  if (!Number.isFinite(tsNum) || tsNum <= 0) return { ok: false, reason: 'Invalid ts in Paddle-Signature header' };

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsNum) > toleranceSeconds) {
    return { ok: false, reason: 'Webhook timestamp outside tolerance window' };
  }

  const signedPayload = `${parsed.ts}:${rawBody}`;
  const expectedHex = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  const expected = Buffer.from(expectedHex, 'utf8');

  for (const providedHex of parsed.h1) {
    const provided = Buffer.from(providedHex, 'utf8');

    if (provided.length !== expected.length) continue;
    if (timingSafeEqual(provided, expected)) return { ok: true };
  }

  return { ok: false, reason: 'Signature mismatch' };
}
