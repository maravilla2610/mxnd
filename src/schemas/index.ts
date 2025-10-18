import { z } from 'zod';

// Chain validation
export const ChainSchema = z.enum(['ethereum', 'polygon', 'avalanche']);

// Ethereum address validation
export const EthAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Wallet ID validation
export const WalletIdSchema = z.string().min(32).max(64);

// Amount validation
export const AmountSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number');

// ==================== Request Schemas ====================

export const CreateWalletRequestSchema = z.object({
  name: z.string().optional()
});

export const RecoverWalletRequestSchema = z.object({
  seedPhrase: z.string().min(1, 'Seed phrase is required')
});

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

export const AddressesSchema = z.object({
  ethereum: EthAddressSchema,
  polygon: EthAddressSchema,
  avalanche: EthAddressSchema
});

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

export const BalanceResponseSchema = z.object({
  chain: ChainSchema,
  address: EthAddressSchema,
  balance: z.string(),
  decimals: z.number(),
  symbol: z.string(),
  formatted: z.string()
});

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

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional()
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

export const WalletListResponseSchema = z.object({
  count: z.number(),
  wallets: z.array(WalletIdSchema)
});

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

export const WalletIdParamSchema = z.object({
  walletId: WalletIdSchema
});

export const ChainWalletParamSchema = z.object({
  chain: ChainSchema,
  walletId: WalletIdSchema
});

export const TokenInfoParamSchema = z.object({
  chain: ChainSchema,
  tokenAddress: EthAddressSchema
});
