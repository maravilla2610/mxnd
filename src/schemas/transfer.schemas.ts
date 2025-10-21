import { z } from 'zod';
import { ChainSchema, EthAddressSchema, WalletIdSchema, AmountSchema } from './base.schemas.ts';

// ==================== Request Schemas ====================

export const TransferRequestSchema = z.object({
  walletId: WalletIdSchema,
  seedPhrase: z.string().optional(),
  chain: ChainSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

export const QuoteRequestSchema = z.object({
  walletId: WalletIdSchema,
  chain: ChainSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

// ==================== Response Schemas ====================

export const TransferResponseSchema = z.object({
  success: z.boolean(),
  transactionHash: z.string(),
  chain: ChainSchema,
  from: EthAddressSchema,
  to: EthAddressSchema,
  amount: z.string(),
  explorerUrl: z.string().url()
});

export const QuoteResponseSchema = z.object({
  chain: ChainSchema,
  estimatedGas: z.string(),
  gasPrice: z.string(),
  estimatedCost: z.string(),
  estimatedCostFormatted: z.string()
});
