import { SupportedChain } from '../config/chains.ts';

export interface WalletInfo {
  id: string;
  addresses: {
    ethereum: string;
    polygon: string;
    avalanche: string;
  };
  createdAt: string;
}

export interface BalanceResponse {
  chain: SupportedChain;
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string;
}

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

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}

export interface CreateWalletRequest {
  name?: string;
}

export interface CreateWalletResponse {
  walletId: string;
  seedPhrase: string;
  addresses: {
    ethereum: string;
    polygon: string;
    avalanche: string;
  };
  warning: string;
}

export interface TokenTransferParams {
  walletId: string;
  chain: SupportedChain;
  tokenAddress: string;
  to: string;
  amount: string;
}

export interface TokenTransferWithSeedParams {
  seedPhrase: string;
  chain: SupportedChain;
  tokenAddress: string;
  to: string;
  amount: string;
}

export interface TokenTransferResponse {
  success: boolean;
  transactionHash: string;
  chain: SupportedChain;
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  explorerUrl: string;
}

export interface TokenBalanceResponse {
  chain: SupportedChain;
  address: string;
  tokenAddress: string;
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string;
  name?: string;
}