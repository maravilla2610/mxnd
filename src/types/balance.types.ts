import { SupportedChain } from '../config/chains.ts';

export interface BalanceResponse {
  chain: SupportedChain;
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
  formatted: string;
}
