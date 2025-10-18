import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { WalletService } from '../../services/wallet.service.ts';
import {
  CreateWalletResponseSchema,
  WalletInfoResponseSchema,
  WalletListResponseSchema,
  ErrorResponseSchema,
  WalletIdParamSchema,
  CreateWalletRequestSchema,
  RecoverWalletRequestSchema,
  RecoverWalletResponseSchema
} from '../../schemas/index.ts';

const walletRoutes = new OpenAPIHono();

// Create Wallet Route
const createWalletRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Wallet'],
  summary: 'Create a new wallet',
  description: 'Generate a new multi-chain wallet with seed phrase and addresses for Ethereum, Polygon, and Avalanche',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateWalletRequestSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Wallet created successfully',
      content: {
        'application/json': {
          schema: CreateWalletResponseSchema
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

walletRoutes.openapi(createWalletRoute, async (c) => {
  try {
    const { walletId, seedPhrase, addresses } = await WalletService.createWallet();

    return c.json({
      walletId,
      seedPhrase,
      addresses,
      warning: '⚠️ STORE YOUR SEED PHRASE SECURELY! This is the only time it will be shown. You cannot recover your wallet without it.'
    }, 201);
  } catch (error: any) {
    return c.json({
      error: 'WALLET_CREATION_FAILED',
      message: error.message || 'Failed to create wallet',
      details: error
    }, 500);
  }
});

// Get Wallet Info Route
const getWalletRoute = createRoute({
  method: 'get',
  path: '/{walletId}',
  tags: ['Wallet'],
  summary: 'Get wallet information',
  description: 'Retrieve addresses for all supported chains for a specific wallet',
  request: {
    params: WalletIdParamSchema
  },
  responses: {
    200: {
      description: 'Wallet information retrieved successfully',
      content: {
        'application/json': {
          schema: WalletInfoResponseSchema
        }
      }
    },
    404: {
      description: 'Wallet not found',
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

walletRoutes.openapi(getWalletRoute, async (c) => {
  try {
    const { walletId } = c.req.valid('param');

    if (!WalletService.walletExists(walletId)) {
      return c.json({
        error: 'WALLET_NOT_FOUND',
        message: 'Wallet with the provided ID does not exist'
      }, 404);
    }

    const addresses = await WalletService.getWalletAddresses(walletId);

    return c.json({
      id: walletId,
      addresses,
      createdAt: new Date().toISOString()
    }, 200);
  } catch (error: any) {
    return c.json({
      error: 'WALLET_FETCH_FAILED',
      message: error.message || 'Failed to fetch wallet information',
      details: error
    }, 500);
  }
});

// List Wallets Route
const listWalletsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Wallet'],
  summary: 'List all wallets',
  description: 'Get a list of all wallet IDs (debugging endpoint)',
  responses: {
    200: {
      description: 'Wallet list retrieved successfully',
      content: {
        'application/json': {
          schema: WalletListResponseSchema
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

walletRoutes.openapi(listWalletsRoute, (c) => {
  try {
    const walletIds = WalletService.getAllWalletIds();

    return c.json({
      count: walletIds.length,
      wallets: walletIds
    }, 200);
  } catch (error: any) {
    return c.json({
      error: 'WALLET_LIST_FAILED',
      message: error.message || 'Failed to list wallets',
      details: error
    }, 500);
  }
});

// Recover Wallet Route
const recoverWalletRoute = createRoute({
  method: 'post',
  path: '/recover',
  tags: ['Wallet'],
  summary: 'Recover wallet from seed phrase',
  description: 'Retrieve wallet addresses across all supported chains using a seed phrase',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RecoverWalletRequestSchema
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
      description: 'Invalid seed phrase',
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

walletRoutes.openapi(recoverWalletRoute, async (c) => {
  try {
    const { seedPhrase } = c.req.valid('json');

    // Validate seed phrase (basic check)
    if (!seedPhrase || seedPhrase.trim().split(/\s+/).length < 12) {
      return c.json({
        error: 'INVALID_SEED_PHRASE',
        message: 'Seed phrase must contain at least 12 words'
      }, 400);
    }

    const addresses = await WalletService.getAddressesFromSeedPhrase(seedPhrase.trim());

    return c.json({
      addresses
    }, 200);
  } catch (error: any) {
    return c.json({
      error: 'WALLET_RECOVERY_FAILED',
      message: error.message || 'Failed to recover wallet from seed phrase',
      details: error
    }, 500);
  }
});

export default walletRoutes;
