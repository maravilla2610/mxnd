import { z } from 'zod';

// Incoming USDT Payment Schema
export const IncomingPaymentSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/).describe('Merchant wallet address'),
  tx_hash: z.string().describe('Transaction hash'),
  amount: z.string().describe('Amount in USDT'),
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/).describe('Sender address'),
  token: z.string().describe('Token contract address'),
  chain: z.string().describe('Blockchain network')
});

export const IncomingPaymentResponseSchema = z.object({
  success: z.boolean(),
  transaction_id: z.string().uuid().optional(),
  message: z.string()
});

// Transaction Update Schema
export const TransactionUpdateSchema = z.object({
  tx_hash: z.string().describe('Transaction hash'),
  status: z.string().describe('Transaction status'),
  confirmations: z.number().describe('Number of confirmations')
});

export const TransactionUpdateResponseSchema = z.object({
  success: z.boolean(),
  transaction_id: z.string().uuid().optional()
});
