import { Hono } from 'hono';
import { WalletService } from '../services/wallet.service.ts';
import { AuthService } from '../services/auth.service.ts';
import type { CreateWalletResponse, WalletInfo, ErrorResponse } from '../types/index.ts';

const walletRoutes = new Hono();

/**
 * Middleware to verify authentication token
 */
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authorization token is required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);
    c.set('userId', userId);
    await next();
  } catch (error: any) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Invalid token' }, 401);
  }
};


/**
 * GET /api/v1/wallet/address
 * Get wallet address for QR code generation (requires auth)
 */
walletRoutes.get('/address', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const walletInfo = await WalletService.getWalletAddress(userId);

    return c.json(walletInfo);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'WALLET_ADDRESS_FAILED',
      message: error.message || 'Failed to get wallet address',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/wallet/balance
 * Get USDT balance (requires auth)
 */
walletRoutes.get('/balance', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const balance = await WalletService.getBalance(userId);

    return c.json(balance);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'BALANCE_FETCH_FAILED',
      message: error.message || 'Failed to fetch balance',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/wallet/transactions
 * Get transaction history (requires auth)
 */
walletRoutes.get('/transactions', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '20');

    const transactions = await WalletService.getTransactions(userId, limit);

    return c.json({ transactions });
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'TRANSACTIONS_FETCH_FAILED',
      message: error.message || 'Failed to fetch transactions',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/wallet/balances
 * Get multi-currency balances (requires auth)
 */
walletRoutes.get('/balances', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const balances = await WalletService.getMultiCurrencyBalance(userId);

    return c.json(balances);
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'BALANCES_FETCH_FAILED',
      message: error.message || 'Failed to fetch multi-currency balances',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

export default walletRoutes;
