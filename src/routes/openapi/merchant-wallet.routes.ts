import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { WalletService } from '../../services/wallet.service.ts';
import { AuthService } from '../../services/auth.service.ts';
import {
  WalletAddressResponseSchema,
  USDTBalanceResponseSchema,
  MultiCurrencyBalanceResponseSchema,
  TransactionsResponseSchema,
  TransactionsQuerySchema
} from '../../schemas/merchant-wallet.schemas.ts';
import { ErrorResponseSchema } from '../../schemas/error.schemas.ts';

const merchantWalletRoutes = new OpenAPIHono();

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

// Get Wallet Address Route
const getWalletAddressRoute = createRoute({
  method: 'get',
  path: '/address',
  tags: ['Merchant Wallet'],
  summary: 'Get wallet address for QR code',
  description: 'Retrieve the merchant\'s wallet address to generate QR codes for customer payments',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Wallet address',
      content: {
        'application/json': {
          schema: WalletAddressResponseSchema
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

merchantWalletRoutes.openapi(getWalletAddressRoute, async (c) => {
  // Auth check
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authorization token is required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);
    const walletInfo = await WalletService.getWalletAddress(userId);
    return c.json(walletInfo, 200);
  } catch (error: any) {
    return c.json({
      error: 'WALLET_ADDRESS_FAILED',
      message: error.message || 'Failed to get wallet address',
      details: error
    }, 500);
  }
});

// Get USDT Balance Route
const getBalanceRoute = createRoute({
  method: 'get',
  path: '/balance',
  tags: ['Merchant Wallet'],
  summary: 'Get USDT balance',
  description: 'Fetch the current USDT balance of the merchant\'s wallet',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'USDT balance',
      content: {
        'application/json': {
          schema: USDTBalanceResponseSchema
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

merchantWalletRoutes.openapi(getBalanceRoute, async (c) => {
  // Auth check
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authorization token is required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);
    const balance = await WalletService.getBalance(userId);
    return c.json(balance, 200);
  } catch (error: any) {
    return c.json({
      error: 'BALANCE_FETCH_FAILED',
      message: error.message || 'Failed to fetch balance',
      details: error
    }, 500);
  }
});

// Get Multi-Currency Balances Route
const getBalancesRoute = createRoute({
  method: 'get',
  path: '/balances',
  tags: ['Merchant Wallet'],
  summary: 'Get multi-currency balances',
  description: 'Fetch balances for all supported tokens (USDT, USDC, DAI, WETH, WBTC) on Polygon',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Multi-currency balances',
      content: {
        'application/json': {
          schema: MultiCurrencyBalanceResponseSchema
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

merchantWalletRoutes.openapi(getBalancesRoute, async (c) => {
  // Auth check
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authorization token is required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);
    const balances = await WalletService.getMultiCurrencyBalance(userId);
    return c.json(balances, 200);
  } catch (error: any) {
    return c.json({
      error: 'BALANCES_FETCH_FAILED',
      message: error.message || 'Failed to fetch multi-currency balances',
      details: error
    }, 500);
  }
});

// Get Transactions Route
const getTransactionsRoute = createRoute({
  method: 'get',
  path: '/transactions',
  tags: ['Merchant Wallet'],
  summary: 'Get transaction history',
  description: 'Retrieve the transaction history for the merchant\'s wallet',
  security: [{ Bearer: [] }],
  request: {
    query: TransactionsQuerySchema
  },
  responses: {
    200: {
      description: 'Transaction history',
      content: {
        'application/json': {
          schema: TransactionsResponseSchema
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

merchantWalletRoutes.openapi(getTransactionsRoute, async (c) => {
  // Auth check
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authorization token is required' }, 401);
  }

  try {
    const token = authHeader.substring(7);
    const userId = AuthService.verifyToken(token);
    const limit = parseInt(c.req.query('limit') || '20');

    const transactions = await WalletService.getTransactions(userId, limit);
    return c.json({ transactions }, 200);
  } catch (error: any) {
    return c.json({
      error: 'TRANSACTIONS_FETCH_FAILED',
      message: error.message || 'Failed to fetch transactions',
      details: error
    }, 500);
  }
});

export default merchantWalletRoutes;
