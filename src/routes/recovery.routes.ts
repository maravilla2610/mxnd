import { Hono } from 'hono';
import { WalletService } from '../services/wallet.service.ts';
import { AuthService } from '../services/auth.service.ts';
import type { ErrorResponse } from '../types/index.ts';

const recoveryRoutes = new Hono();

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
 * POST /api/v1/recovery/wallet
 * Recover wallet using merchant shares
 *
 * Requires at least 3 shares from:
 * - Share 1: Merchant's device
 * - Share 2: Merchant's backup (email)
 * - Share 3-4: Backend (we provide automatically)
 * - Share 5: Optional third-party
 */
recoveryRoutes.post('/wallet', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { merchantShares } = body;

    if (!merchantShares || !Array.isArray(merchantShares) || merchantShares.length < 1) {
      const errorResponse: ErrorResponse = {
        error: 'INVALID_SHARES',
        message: 'At least one merchant share is required'
      };
      return c.json(errorResponse, 400);
    }

    // Attempt recovery
    const result = await WalletService.recoverWallet(userId, merchantShares);

    return c.json({
      success: result.success,
      address: result.address,
      message: 'Wallet recovered successfully'
    });
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'RECOVERY_FAILED',
      message: error.message || 'Failed to recover wallet',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

/**
 * GET /api/v1/recovery/share-info
 * Get information about the current share distribution
 */
recoveryRoutes.get('/share-info', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    // Get wallet info
    const wallet = await WalletService.getWalletAddress(userId);

    return c.json({
      address: wallet.address,
      key_management: 'shamir',
      total_shares: 5,
      threshold: 3,
      shares_held: {
        merchant_device: 1,
        merchant_backup: 1,
        backend: 2,
        third_party: 1
      },
      message: 'You need at least 3 shares to recover your wallet'
    });
  } catch (error: any) {
    const errorResponse: ErrorResponse = {
      error: 'SHARE_INFO_FAILED',
      message: error.message || 'Failed to get share information',
      details: error
    };
    return c.json(errorResponse, 500);
  }
});

export default recoveryRoutes;
