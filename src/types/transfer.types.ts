import { SupportedChain } from '../config/chains.ts';

export interface TransferRequest {
  walletId: string;
  chain: SupportedChain;
  to: string;
  amount: string;
}

export interface TransferResponse {
  success: boolean;
  transactionHash: string;
  chain: SupportedChain;
  from: string;
  to: string;
  amount: string;
  explorerUrl: string;
}

export interface QuoteRequest {
  walletId: string;
  chain: SupportedChain;
  to: string;
  amount: string;
}

export interface QuoteResponse {
  chain: SupportedChain;
  estimatedGas: string;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostFormatted: string;
}
