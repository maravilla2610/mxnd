import { z } from 'zod';
import { ChainSchema, EthAddressSchema, WalletIdSchema } from './base.schemas.ts';

// ==================== Request Schemas ====================

export const NativeBalanceWithSeedRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required')
});

// ==================== Response Schemas ====================

export const BalanceResponseSchema = z.object({
  chain: ChainSchema,
  address: EthAddressSchema,
  balance: z.string(),
  decimals: z.number(),
  symbol: z.string(),
  formatted: z.string()
});

export const AllBalancesResponseSchema = z.object({
  walletId: WalletIdSchema,
  balances: z.record(z.object({
    address: EthAddressSchema,
    balance: z.string(),
    raw: z.string(),
    decimals: z.number(),
    symbol: z.string()
  }))
});

export const NativeBalancesResponseSchema = z.object({
  ethereum: z.object({
    raw: z.string(),
    formatted: z.string(),
    decimals: z.number(),
    symbol: z.string()
  }),
  polygon: z.object({
    raw: z.string(),
    formatted: z.string(),
    decimals: z.number(),
    symbol: z.string()
  }),
  avalanche: z.object({
    raw: z.string(),
    formatted: z.string(),
    decimals: z.number(),
    symbol: z.string()
  })
});

// ==================== Path Params ====================

export const ChainWalletParamSchema = z.object({
  chain: ChainSchema,
  walletId: WalletIdSchema
});
