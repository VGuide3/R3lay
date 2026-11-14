import { z } from 'zod';

export const CreateCampaignInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  enabledChains: z.array(z.enum(['evm', 'solana', 'tron', 'xrp'])).min(1),
  assets: z.array(z.object({
    id: z.string(),
    chain: z.enum(['evm', 'solana', 'tron', 'xrp']),
    symbol: z.string(),
    address: z.string().optional(),
    mint: z.string().optional(),
    decimals: z.number().int().nonnegative(),
    amountRule: z.object({
      type: z.enum(['fixed', 'percentage', 'unlimited']),
      value: z.number().positive().optional(),
    }),
  })),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;
