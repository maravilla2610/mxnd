import { z } from 'zod';
import { ChainSchema, EthAddressSchema, WalletIdSchema, AmountSchema } from './base.schemas.ts';

// ==================== Request Schemas ====================

export const TokenTransferRequestSchema = z.object({
  walletId: WalletIdSchema,
  chain: ChainSchema,
  tokenAddress: EthAddressSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

export const TokenBalanceRequestSchema = z.object({
  walletId: WalletIdSchema,
  chain: ChainSchema,
  tokenAddress: EthAddressSchema
});

export const TokenEstimateRequestSchema = z.object({
  walletId: WalletIdSchema,
  chain: ChainSchema,
  tokenAddress: EthAddressSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

export const TokenTransferWithSeedRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required'),
  chain: ChainSchema,
  tokenAddress: EthAddressSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

export const TokenBalanceWithSeedRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required'),
  chain: ChainSchema,
  tokenAddress: EthAddressSchema
});

export const TokenEstimateWithSeedRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required'),
  chain: ChainSchema,
  tokenAddress: EthAddressSchema,
  to: EthAddressSchema,
  amount: AmountSchema
});

// ==================== Response Schemas ====================

export const TokenTransferResponseSchema = z.object({
  success: z.boolean(),
  transactionHash: z.string(),
  chain: ChainSchema,
  from: EthAddressSchema,
  to: EthAddressSchema,
  amount: z.string(),
  tokenAddress: EthAddressSchema,
  explorerUrl: z.string().url()
});

export const TokenBalanceResponseSchema = z.object({
  chain: ChainSchema,
  address: EthAddressSchema,
  tokenAddress: EthAddressSchema,
  balance: z.string(),
  decimals: z.number(),
  symbol: z.string(),
  formatted: z.string(),
  name: z.string().optional()
});

export const TokenInfoResponseSchema = z.object({
  symbol: z.string(),
  decimals: z.number(),
  name: z.string().optional()
});

// ==================== Path Params ====================

export const TokenInfoParamSchema = z.object({
  chain: ChainSchema,
  tokenAddress: EthAddressSchema
});
