import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { WalletService } from '../../services/wallet.service.ts';
import { TokenService } from '../../services/token.service.ts';
import { isValidChain, type SupportedChain } from '../../config/chains.ts';
import { formatBalance } from '../../utils/formatters.ts';
import {
  TokenBalanceResponseSchema,
  ErrorResponseSchema,
  TokenBalanceRequestSchema,
  TokenBalanceWithSeedRequestSchema,
  NativeBalanceWithSeedRequestSchema,
  NativeBalancesResponseSchema
} from '../../schemas/index.ts';

const balanceRoutes = new OpenAPIHono();

// Get Token Balance Route
const getBalanceRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Balance'],
  summary: 'Get balance of any ERC-20 token',
  description: 'Retrieve ERC-20 token balance for a wallet on a specific blockchain',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenBalanceRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Balance retrieved successfully',
      content: {
        'application/json': {
          schema: TokenBalanceResponseSchema
        }
      }
    },
    400: {
      description: 'Invalid request parameters',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
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

balanceRoutes.openapi(getBalanceRoute, async (c) => {
  try {
    const { walletId, chain, tokenAddress } = c.req.valid('json');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Validate wallet exists
    if (!WalletService.walletExists(walletId)) {
      return c.json({
        error: 'WALLET_NOT_FOUND',
        message: 'Wallet with the provided ID does not exist'
      }, 404);
    }

    // Get balance
    const balance = await TokenService.getBalance(walletId, chain as SupportedChain, tokenAddress);

    return c.json(balance, 200);
  } catch (error) {
    const err = error as Error;
    return c.json({
      error: 'BALANCE_FAILED',
      message: err.message || 'Failed to get token balance',
      details: error
    }, 500);
  }
});

// Get Token Balance with Seed Route
const getBalanceWithSeedRoute = createRoute({
  method: 'post',
  path: '/with-seed',
  tags: ['Balance'],
  summary: 'Get balance of any ERC-20 token using seed phrase',
  description: 'Retrieve ERC-20 token balance using a seed phrase directly (no wallet ID required)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenBalanceWithSeedRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Balance retrieved successfully',
      content: {
        'application/json': {
          schema: TokenBalanceResponseSchema
        }
      }
    },
    400: {
      description: 'Invalid request parameters',
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

balanceRoutes.openapi(getBalanceWithSeedRoute, async (c) => {
  try {
    const { seedPhrase, chain, tokenAddress } = c.req.valid('json');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Get balance using seed phrase
    const balance = await TokenService.getBalanceWithSeed(seedPhrase, chain as SupportedChain, tokenAddress);

    return c.json(balance, 200);
  } catch (error) {
    const err = error as Error;
    return c.json({
      error: 'BALANCE_FAILED',
      message: err.message || 'Failed to get token balance',
      details: error
    }, 500);
  }
});

// Get Native Balances for All Chains with Seed Route
const getNativeBalancesWithSeedRoute = createRoute({
  method: 'post',
  path: '/native/seed',
  tags: ['Balance'],
  summary: 'Get native token balances across all chains using seed phrase',
  description: 'Retrieve native token (ETH, MATIC, AVAX) balances for all supported chains using a seed phrase',
  request: {
    body: {
      content: {
        'application/json': {
          schema: NativeBalanceWithSeedRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Native balances retrieved successfully',
      content: {
        'application/json': {
          schema: NativeBalancesResponseSchema
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

balanceRoutes.openapi(getNativeBalancesWithSeedRoute, async (c) => {
  try {
    const { seedPhrase } = c.req.valid('json');

    // Validate seed phrase
    if (!seedPhrase || seedPhrase.trim().split(/\s+/).length < 12) {
      return c.json({
        error: 'INVALID_SEED_PHRASE',
        message: 'Seed phrase must contain at least 12 words'
      }, 400);
    }

    // Get native balances for all chains
    const balances = await TokenService.getNativeBalanceWithSeed(seedPhrase.trim());

    // Format balances with proper decimals (18 for all native tokens)
    const formattedBalances = {
      ethereum: {
        raw: balances.ethereum.toString(),
        formatted: formatBalance(balances.ethereum, 18),
        decimals: 18,
        symbol: 'ETH'
      },
      polygon: {
        raw: balances.polygon.toString(),
        formatted: formatBalance(balances.polygon, 18),
        decimals: 18,
        symbol: 'MATIC'
      },
      avalanche: {
        raw: balances.avalanche.toString(),
        formatted: formatBalance(balances.avalanche, 18),
        decimals: 18,
        symbol: 'AVAX'
      }
    };

    return c.json(formattedBalances, 200);
  } catch (error) {
    const err = error as Error;
    return c.json({
      error: 'BALANCE_FAILED',
      message: err.message || 'Failed to get native balances',
      details: error
    }, 500);
  }
});

export default balanceRoutes;
