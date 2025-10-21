import { z } from 'zod';

// Chain validation
export const ChainSchema = z.enum(['ethereum', 'polygon', 'avalanche']);

// Ethereum address validation
export const EthAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// Wallet ID validation
export const WalletIdSchema = z.string().min(32).max(64);

// Amount validation
export const AmountSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number');
