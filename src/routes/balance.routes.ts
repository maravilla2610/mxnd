import { Hono } from 'hono';
import { WalletService } from '../services/wallet.service.ts';
import { isValidChain, type SupportedChain } from '../config/chains.ts';
import type { BalanceResponse, ErrorResponse } from '../types/index.ts';
import { TokenService } from '../services/token.service.ts';

const balanceRoutes = new Hono();

/**
 * POST /api/v1/token/balance
 * Get balance of any ERC-20 token
 */
balanceRoutes.post( async (c) => {
  try {
    const body = await c.req.json();
    const { walletId, chain, tokenAddress } = body;

    // Validate required fields
    if (!walletId || !chain || !tokenAddress) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Required fields: walletId, chain, tokenAddress'
      };
      return c.json(errorResponse, 400);
    }

    // Validate chain
    if (!isValidChain(chain)) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      };
      return c.json(errorResponse, 400);
    }

    // Validate wallet exists
    if (!WalletService.walletExists(walletId)) {
      const errorResponse: ErrorResponse = {
        error: 'WALLET_NOT_FOUND',
        message: 'Wallet with the provided ID does not exist'
      };
      return c.json(errorResponse, 404);
    }

    // Get balance
    const balance = await TokenService.getBalance(walletId, chain as SupportedChain, tokenAddress);

    return c.json(balance, 200);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'BALANCE_FAILED',
      message: error.message || 'Failed to get token balance',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});


export default balanceRoutes;
