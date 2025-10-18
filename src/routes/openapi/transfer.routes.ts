import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { TokenService } from '../../services/token.service.ts';
import { WalletService } from '../../services/wallet.service.ts';
import { isValidChain, type SupportedChain } from '../../config/chains.ts';
import {
  TokenTransferRequestSchema,
  TokenTransferResponseSchema,
  TokenBalanceRequestSchema,
  TokenBalanceResponseSchema,
  TokenEstimateRequestSchema,
  QuoteResponseSchema,
  TokenInfoParamSchema,
  TokenInfoResponseSchema,
  ErrorResponseSchema,
  TokenTransferWithSeedRequestSchema,
  TokenBalanceWithSeedRequestSchema,
  TokenEstimateWithSeedRequestSchema
} from '../../schemas/index.ts';

const transferRoutes = new OpenAPIHono();

// Transfer Token Route
const transferRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Transfer'],
  summary: 'Transfer any ERC-20 token',
  description: 'Send any ERC-20 token from a wallet to another address on a specific blockchain',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenTransferRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Token transfer completed successfully',
      content: {
        'application/json': {
          schema: TokenTransferResponseSchema
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
      description: 'Transfer failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(transferRoute, async (c) => {
  try {
    const { walletId, chain, tokenAddress, to, amount } = c.req.valid('json');

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

    // Execute transfer
    const result = await TokenService.transfer({
      walletId,
      chain: chain as SupportedChain,
      tokenAddress,
      to,
      amount
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({
      error: 'TRANSFER_FAILED',
      message: error.message || 'Failed to execute token transfer',
      details: error
    }, 500);
  }
});



// Estimate Token Transfer Cost Route
const estimateRoute = createRoute({
  method: 'post',
  path: '/estimate',
  tags: ['Transfer'],
  summary: 'Estimate token transfer gas cost',
  description: 'Get an estimate of the gas cost required to transfer ERC-20 tokens',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenEstimateRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Estimate generated successfully',
      content: {
        'application/json': {
          schema: QuoteResponseSchema
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
      description: 'Estimate generation failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(estimateRoute, async (c) => {
  try {
    const { walletId, chain, tokenAddress, to, amount } = c.req.valid('json');

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

    // Get estimate
    const estimate = await TokenService.estimateTransferCost(
      walletId,
      chain as SupportedChain,
      tokenAddress,
      to,
      amount
    );

    return c.json(estimate, 200);
  } catch (error: any) {
    return c.json({
      error: 'ESTIMATE_FAILED',
      message: error.message || 'Failed to estimate gas cost',
      details: error
    }, 500);
  }
});

// Get Token Info Route
const infoRoute = createRoute({
  method: 'get',
  path: '/info/{chain}/{tokenAddress}',
  tags: ['Transfer'],
  summary: 'Get token information',
  description: 'Get information about any ERC-20 token (symbol, decimals, name)',
  request: {
    params: TokenInfoParamSchema
  },
  responses: {
    200: {
      description: 'Token information retrieved successfully',
      content: {
        'application/json': {
          schema: TokenInfoResponseSchema
        }
      }
    },
    400: {
      description: 'Invalid chain parameter',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    },
    500: {
      description: 'Failed to get token information',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(infoRoute, async (c) => {
  try {
    const { chain, tokenAddress } = c.req.valid('param');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Get token info
    const info = await TokenService.getTokenInfo(chain as SupportedChain, tokenAddress);

    return c.json(info, 200);
  } catch (error: any) {
    return c.json({
      error: 'TOKEN_INFO_FAILED',
      message: error.message || 'Failed to get token information',
      details: error
    }, 500);
  }
});

// Transfer Token with Seed Phrase Route
const transferWithSeedRoute = createRoute({
  method: 'post',
  path: '/transfer-with-seed',
  tags: ['Transfer'],
  summary: 'Transfer token using seed phrase',
  description: 'Send any ERC-20 token using a seed phrase directly (no walletId required)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenTransferWithSeedRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Token transfer completed successfully',
      content: {
        'application/json': {
          schema: TokenTransferResponseSchema
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
      description: 'Transfer failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(transferWithSeedRoute, async (c) => {
  try {
    const { seedPhrase, chain, tokenAddress, to, amount } = c.req.valid('json');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Validate seed phrase
    if (!seedPhrase || seedPhrase.trim().split(/\s+/).length < 12) {
      return c.json({
        error: 'INVALID_SEED_PHRASE',
        message: 'Seed phrase must contain at least 12 words'
      }, 400);
    }

    // Execute transfer
    const result = await TokenService.transferWithSeed({
      seedPhrase: seedPhrase.trim(),
      chain: chain as SupportedChain,
      tokenAddress,
      to,
      amount
    });

    return c.json(result, 200);
  } catch (error: any) {
    return c.json({
      error: 'TRANSFER_FAILED',
      message: error.message || 'Failed to execute token transfer',
      details: error
    }, 500);
  }
});

// Estimate Token Transfer Cost with Seed Phrase Route
const estimateWithSeedRoute = createRoute({
  method: 'post',
  path: '/estimate/seed',
  tags: ['Transfer'],
  summary: 'Estimate token transfer cost using seed phrase',
  description: 'Get an estimate of the gas cost required to transfer ERC-20 tokens using a seed phrase directly (no walletId required)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: TokenEstimateWithSeedRequestSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Estimate generated successfully',
      content: {
        'application/json': {
          schema: QuoteResponseSchema
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
      description: 'Estimate generation failed',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(estimateWithSeedRoute, async (c) => {
  try {
    const { seedPhrase, chain, tokenAddress, to, amount } = c.req.valid('json');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Validate seed phrase
    if (!seedPhrase || seedPhrase.trim().split(/\s+/).length < 12) {
      return c.json({
        error: 'INVALID_SEED_PHRASE',
        message: 'Seed phrase must contain at least 12 words'
      }, 400);
    }

    // Get estimate
    const estimate = await TokenService.estimateTransferCostWithSeed(
      seedPhrase.trim(),
      chain as SupportedChain,
      tokenAddress,
      to,
      amount
    );

    return c.json(estimate, 200);
  } catch (error: any) {
    return c.json({
      error: 'ESTIMATE_FAILED',
      message: error.message || 'Failed to estimate gas cost',
      details: error
    }, 500);
  }
});

// Get Token Balance with Seed Phrase Route
const balanceWithSeedRoute = createRoute({
  method: 'post',
  path: '/balance-with-seed',
  tags: ['Transfer'],
  summary: 'Get token balance using seed phrase',
  description: 'Get the balance of any ERC-20 token using a seed phrase directly (no walletId required)',
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
      description: 'Token balance retrieved successfully',
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
      description: 'Failed to get balance',
      content: {
        'application/json': {
          schema: ErrorResponseSchema
        }
      }
    }
  }
});

transferRoutes.openapi(balanceWithSeedRoute, async (c) => {
  try {
    const { seedPhrase, chain, tokenAddress } = c.req.valid('json');

    // Validate chain
    if (!isValidChain(chain)) {
      return c.json({
        error: 'INVALID_CHAIN',
        message: `Chain "${chain}" is not supported. Valid chains: ethereum, polygon, avalanche`
      }, 400);
    }

    // Validate seed phrase
    if (!seedPhrase || seedPhrase.trim().split(/\s+/).length < 12) {
      return c.json({
        error: 'INVALID_SEED_PHRASE',
        message: 'Seed phrase must contain at least 12 words'
      }, 400);
    }

    // Get balance
    const balance = await TokenService.getBalanceWithSeed(
      seedPhrase.trim(),
      chain as SupportedChain,
      tokenAddress
    );

    return c.json(balance, 200);
  } catch (error: any) {
    return c.json({
      error: 'BALANCE_FAILED',
      message: error.message || 'Failed to get token balance',
      details: error
    }, 500);
  }
});

export default transferRoutes;
