import { z } from 'zod';

export const publicEventSchema = z.object({
  slug: z.string().min(1),
  wallet: z.string().min(1),
  chain: z.enum(['evm', 'solana', 'tron', 'xrp']),
  assetId: z.string().min(1),
  outcome: z.enum(['connected', 'permission_requested', 'granted', 'rejected', 'failed']).optional(),
});

export type PublicEventInput = z.infer<typeof publicEventSchema>;
