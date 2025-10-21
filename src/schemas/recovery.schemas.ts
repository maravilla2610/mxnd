import { z } from 'zod';

// Recover Wallet Schema
export const RecoverWalletSchema = z.object({
  merchantShares: z.array(z.string()).min(1).max(3).describe('Array of merchant Shamir shares (need at least 1, backend provides 2)')
});

export const RecoverWalletResponseSchema = z.object({
  success: z.boolean(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  message: z.string()
});

// Share Info Schema
export const ShareInfoResponseSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  key_management: z.enum(['shamir', 'custodial', 'mpc']),
  total_shares: z.number(),
  threshold: z.number(),
  shares_held: z.object({
    merchant_device: z.number(),
    merchant_backup: z.number(),
    backend: z.number(),
    third_party: z.number()
  }),
  message: z.string()
});
