import { SupportedChain } from '../config/chains.ts';

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
