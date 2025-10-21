import { z } from 'zod';
import { EthAddressSchema } from './base.schemas.ts';

// Wallet Address Response
export const WalletAddressResponseSchema = z.object({
  address: EthAddressSchema.describe('Wallet address for receiving payments'),
  network: z.string().describe('Blockchain network (e.g., polygon)')
});

// Single Balance
export const TokenBalanceSchema = z.object({
  token: z.string().describe('Token symbol (e.g., USDT, USDC)'),
  symbol: z.string().describe('Token symbol'),
  balance: z.string().describe('Balance amount'),
  decimals: z.number().describe('Token decimals'),
  tokenAddress: EthAddressSchema.describe('ERC-20 token contract address'),
  chain: z.string().describe('Blockchain network'),
  usdValue: z.string().optional().describe('USD equivalent value')
});

// USDT Balance Response
export const USDTBalanceResponseSchema = z.object({
  balance: z.string().describe('USDT balance'),
  token: z.string().describe('Token symbol (USDT)')
});

// Multi-Currency Balance Response
export const MultiCurrencyBalanceResponseSchema = z.object({
  balances: z.array(TokenBalanceSchema).describe('Array of token balances'),
  totalUsdValue: z.string().describe('Total USD value of all balances')
});

// Transaction Item
export const TransactionSchema = z.object({
  tx_hash: z.string().describe('Transaction hash'),
  timestamp: z.string().datetime().describe('Transaction timestamp'),
  type: z.enum(['receive', 'send', 'withdraw']).describe('Transaction type'),
  from: EthAddressSchema.describe('Sender address'),
  to: EthAddressSchema.describe('Recipient address'),
  amount: z.string().describe('Transaction amount'),
  token: z.string().describe('Token symbol'),
  token_address: EthAddressSchema.optional().describe('Token contract address'),
  chain: z.string().describe('Blockchain network'),
  status: z.enum(['pending', 'confirmed', 'failed']).describe('Transaction status'),
  fiat_value: z.string().optional().describe('Fiat value at transaction time'),
  fiat_currency: z.string().optional().describe('Fiat currency (e.g., USD)')
});

// Transactions Response
export const TransactionsResponseSchema = z.object({
  transactions: z.array(TransactionSchema).describe('Array of transactions')
});

// Query Params
export const TransactionsQuerySchema = z.object({
  limit: z.string().optional().describe('Number of transactions to return (default: 20)')
});
