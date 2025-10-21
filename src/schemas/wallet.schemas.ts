import { z } from 'zod';
import { EthAddressSchema, WalletIdSchema } from './base.schemas.ts';

// ==================== Common ====================

export const AddressesSchema = z.object({
  ethereum: EthAddressSchema,
  polygon: EthAddressSchema,
  avalanche: EthAddressSchema
});

// ==================== Request Schemas ====================

export const CreateWalletRequestSchema = z.object({
  name: z.string().optional()
});

export const RecoverWalletRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required')
});

// ==================== Response Schemas ====================

export const CreateWalletResponseSchema = z.object({
  walletId: WalletIdSchema,
  seedPhrase: z.string(),
  addresses: AddressesSchema,
  warning: z.string()
});

export const WalletInfoResponseSchema = z.object({
  id: WalletIdSchema,
  addresses: AddressesSchema,
  createdAt: z.string()
});

export const RecoverWalletResponseSchema = z.object({
  addresses: AddressesSchema
});

export const WalletListResponseSchema = z.object({
  count: z.number(),
  wallets: z.array(WalletIdSchema)
});

// ==================== Path Params ====================

export const WalletIdParamSchema = z.object({
  walletId: WalletIdSchema
});
