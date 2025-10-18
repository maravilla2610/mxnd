import { Hono } from 'hono';
import { WalletService } from '../services/wallet.service.ts';
import type { CreateWalletResponse, WalletInfo, ErrorResponse } from '../types/index.ts';

const walletRoutes = new Hono();

/**
 * POST /api/v1/wallet
 * Create a new wallet
 */
walletRoutes.post('/', async (c) => {
  try {
    const { walletId, seedPhrase, addresses } = await WalletService.createWallet();

    const response: CreateWalletResponse = {
      walletId,
      seedPhrase,
      addresses,
      warning: '⚠️ STORE YOUR SEED PHRASE SECURELY! This is the only time it will be shown. You cannot recover your wallet without it.'
    };

    return c.json(response, 201);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'WALLET_CREATION_FAILED',
      message: error.message || 'Failed to create wallet',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/wallet/:walletId
 * Get wallet addresses
 */
walletRoutes.get('/:walletId', async (c) => {
  try {
    const walletId = c.req.param('walletId');

    if (!WalletService.walletExists(walletId)) {
      const errorResponse: ErrorResponse = {
        error: 'WALLET_NOT_FOUND',
        message: 'Wallet with the provided ID does not exist'
      };
      return c.json(errorResponse, 404);
    }

    const addresses = await WalletService.getWalletAddresses(walletId);

    const response: WalletInfo = {
      id: walletId,
      addresses,
      createdAt: new Date().toISOString() // In production, retrieve from storage
    };

    return c.json(response);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'WALLET_FETCH_FAILED',
      message: error.message || 'Failed to fetch wallet information',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/wallet
 * List all wallet IDs (debug endpoint)
 */
walletRoutes.get('/', async (c) => {
  try {
    const walletIds = WalletService.getAllWalletIds();

    return c.json({
      count: walletIds.length,
      wallets: walletIds
    });
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'WALLET_LIST_FAILED',
      message: error.message || 'Failed to list wallets',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

export default walletRoutes;
