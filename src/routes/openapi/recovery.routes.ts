import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { WalletService } from '../../services/wallet.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import {
  RecoverWalletSchema,
  RecoverWalletResponseSchema,
  ShareInfoResponseSchema
} from '../../schemas/recovery.schemas.ts';
import { ErrorResponseSchema } from '../../schemas/error.schemas.ts';

const recoveryRoutes = new OpenAPIHono();

// Auth Middleware
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

// Recover Wallet Route
const recoverWalletRoute = createRoute({
  method: 'post',
  path: '/wallet',
  tags: ['Recovery'],
  summary: 'Recover wallet using Shamir shares',
  description: 'Recover wallet access by providing merchant shares. Backend automatically provides 2 shares. Need minimum 3 shares total (3-of-5 threshold).',
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RecoverWalletSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Wallet recovered successfully',
      content: {
        'application/json': {
          schema: RecoverWalletResponseSchema
        }
      }
    },
    400: {
      description: 'Invalid shares',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    500: {
      description: 'Recovery failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

recoveryRoutes.openapi(recoverWalletRoute, authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { merchantShares } = c.req.valid('json');

    if (!merchantShares || !Array.isArray(merchantShares) || merchantShares.length < 1) {
      return c.json({
        error: 'INVALID_SHARES',
        message: 'At least one merchant share is required'
      }, 400);
    }

    const result = await WalletService.recoverWallet(userId, merchantShares);

    return c.json({
      success: result.success,
      address: result.address,
      message: 'Wallet recovered successfully'
    }, 200);
  } catch (error: any) {
    return c.json({
      error: 'RECOVERY_FAILED',
      message: error.message || 'Failed to recover wallet',
      details: error
    }, 500);
  }
});

// Get Share Info Route
const getShareInfoRoute = createRoute({
  method: 'get',
  path: '/share-info',
  tags: ['Recovery'],
  summary: 'Get share distribution info',
  description: 'Get information about how Shamir shares are distributed for this wallet',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Share distribution information',
      content: {
        'application/json': {
          schema: ShareInfoResponseSchema
        }
      }
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    500: {
      description: 'Server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

recoveryRoutes.openapi(getShareInfoRoute, authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
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
    }, 200);
  } catch (error: any) {
    return c.json({
      error: 'SHARE_INFO_FAILED',
      message: error.message || 'Failed to get share information',
      details: error
    }, 500);
  }
});

export default recoveryRoutes;
