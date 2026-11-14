import crypto from 'node:crypto';
import { z } from 'zod';

export const CampaignConfigSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  enabledChains: z.array(z.enum(['evm', 'solana', 'tron', 'xrp'])).min(1),
  assets: z.array(z.object({
    id: z.string(),
    chain: z.enum(['evm', 'solana', 'tron', 'xrp']),
    symbol: z.string(),
    address: z.string().optional(),
    mint: z.string().optional(),
    decimals: z.number().int().min(0),
    amountRule: z.object({
      type: z.enum(['fixed', 'percentage', 'unlimited']),
      value: z.number().positive().optional(),
    }),
  })).min(1),
});

export function canonicalizeConfig(input: unknown) {
  return JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
}

export function hashBundleContent(input: unknown) {
  const normalized = canonicalizeConfig(input);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function signBundle(contentHash: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(contentHash).digest('hex');
}

export function verifyBundleSignature(contentHash: string, signature: string, secret: string) {
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(signBundle(contentHash, secret)),
  );
}
