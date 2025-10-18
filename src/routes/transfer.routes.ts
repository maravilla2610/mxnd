import { Hono } from 'hono';
import { TokenService } from '../services/token.service.ts';
import { WalletService } from '../services/wallet.service.ts';
import { isValidChain, type SupportedChain } from '../config/chains.ts';
import type { ErrorResponse } from '../types/index.ts';

const transferRoutes = new Hono();

/**
 * POST /api/v1/token/transfer
 * Transfer any ERC-20 token
 */
transferRoutes.post( async (c) => {
  try {
    const body = await c.req.json();
    const { walletId, chain, tokenAddress, to, amount } = body;

    // Validate required fields
    if (!walletId || !chain || !tokenAddress || !to || !amount) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Required fields: walletId, chain, tokenAddress, to, amount'
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

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number'
      };
      return c.json(errorResponse, 400);
    }

    // Execute transfer
    const result = await TokenService.transfer({
      walletId,
      chain: chain as SupportedChain,
      tokenAddress,
      to,
      amount
    });

    return c.json(result);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'TRANSFER_FAILED',
      message: error.message || 'Failed to execute token transfer',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});


/**
 * POST /api/v1/token/estimate
 * Estimate gas cost for token transfer
 */
transferRoutes.post('/estimate', async (c) => {
  try {
    const body = await c.req.json();
    const { walletId, chain, tokenAddress, to, amount } = body;

    // Validate required fields
    if (!walletId || !chain || !tokenAddress || !to || !amount) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Required fields: walletId, chain, tokenAddress, to, amount'
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

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number'
      };
      return c.json(errorResponse, 400);
    }

    // Get estimate
    const estimate = await TokenService.estimateTransferCost(
      walletId,
      chain as SupportedChain,
      tokenAddress,
      to,
      amount
    );

    return c.json(estimate);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'ESTIMATE_FAILED',
      message: error.message || 'Failed to estimate gas cost',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * POST /api/v1/token/estimate/seed
 * Estimate gas cost for token transfer using seed phrase
 */
transferRoutes.post('/estimate/seed', async (c) => {
  try {
    const body = await c.req.json();
    const { seedPhrase, chain, tokenAddress, to, amount } = body;

    // Validate required fields
    if (!seedPhrase || !chain || !tokenAddress || !to || !amount) {
      const errorResponse: ErrorResponse = {
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Required fields: seedPhrase, chain, tokenAddress, to, amount'
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

    // Validate amount
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number'
      };
      return c.json(errorResponse, 400);
    }

    // Get estimate
    const estimate = await TokenService.estimateTransferCostWithSeed(
      seedPhrase,
      chain as SupportedChain,
      tokenAddress,
      to,
      amount
    );

    return c.json(estimate);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'ESTIMATE_FAILED',
      message: error.message || 'Failed to estimate gas cost',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/token/info/:chain/:tokenAddress
 * Get token information
 */
transferRoutes.get('/info/:chain/:tokenAddress', async (c) => {
  try {
    const chain = c.req.param('chain');
    const tokenAddress = c.req.param('tokenAddress');

    // Validate chain
    if (!isValidChain(chain)) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      };
      return c.json(errorResponse, 400);
    }

    // Get token info
    const info = await TokenService.getTokenInfo(chain as SupportedChain, tokenAddress);

    return c.json(info);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'TOKEN_INFO_FAILED',
      message: error.message || 'Failed to get token information',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

export default transferRoutes;
