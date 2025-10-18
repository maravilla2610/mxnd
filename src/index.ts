// Load environment variables from .env file FIRST
import '@std/dotenv/load';

import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { swaggerUI } from '@hono/swagger-ui';

// Import OpenAPI routes
import walletRoutes from './routes/openapi/wallet.routes.ts';
import balanceRoutes from './routes/openapi/balance.routes.ts';
import transferRoutes from './routes/openapi/transfer.routes.ts';

// Initialize OpenAPI Hono app
const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'MXND Backend API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    documentation: {
      swagger: '/swagger',
      openapi: '/doc'
    },
    endpoints: {
      wallet: '/api/v1/wallet',
      balance: '/api/v1/balance',
      transfer: '/api/v1/transfer',
    }
  });
});

// API Routes
app.route('/api/v1/wallet', walletRoutes);
app.route('/api/v1/balance', balanceRoutes);
app.route('/api/v1/transfer', transferRoutes);

// OpenAPI documentation endpoint
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'MXND Backend API',
    version: '1.0.0',
    description: 'RESTful API for managing MXND stablecoin across Ethereum, Polygon, and Avalanche using Tether WDK',
    contact: {
      name: 'API Support',
      url: 'https://github.com/tetherto/wdk-core'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Wallet',
      description: 'Wallet management operations - create wallets and retrieve addresses'
    },
    {
      name: 'Balance',
      description: 'Balance queries - check MXND token balances across chains'
    },
    {
      name: 'Transfer',
      description: 'Transfer operations - send MXND tokens and estimate gas costs'
    }
  ],
  externalDocs: {
    description: 'Tether WDK Documentation',
    url: 'https://docs.wallet.tether.io/'
  }
});

// Swagger UI
app.get('/swagger', swaggerUI({ url: '/doc' }));

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'NOT_FOUND',
    message: 'The requested endpoint does not exist',
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: Deno.env.get('NODE_ENV') === 'development' ? err.stack : undefined
  }, 500);
});

// Start server with Deno
const port = parseInt(Deno.env.get('PORT') || '3000');

console.log(`
╔═══════════════════════════════════════════════════════╗
║          MXND Backend API Server                      ║
║  Powered by Tether WDK & Hono on Deno                 ║
╚═══════════════════════════════════════════════════════╝

🚀 Server starting on port ${port}...
📡 Supported chains: Ethereum, Polygon, Avalanche
💰 Token: MXND Stablecoin

📚 Documentation:
  • Swagger UI:  http://localhost:${port}/swagger
  • OpenAPI:     http://localhost:${port}/doc

Available endpoints:
  • POST   /api/v1/wallet              - Create wallet
  • POST   /api/v1/wallet/recover      - Recover wallet from seed phrase
  • GET    /api/v1/wallet/:id          - Get wallet info
  • GET    /api/v1/balance/:chain/:id  - Get balance
  • GET    /api/v1/balance/:id         - Get all balances
  • POST   /api/v1/transfer            - Send MXND
  • POST   /api/v1/transfer/quote      - Estimate gas cost
  • POST   /api/v1/token/transfer      - Send any ERC-20 token
  • POST   /api/v1/token/balance       - Get any token balance
  • POST   /api/v1/token/estimate      - Estimate token transfer cost
  • POST   /api/v1/token/transfer-with-seed - Send token with seed phrase
  • POST   /api/v1/token/balance-with-seed  - Get balance with seed phrase
  • GET    /api/v1/token/info/:chain/:address - Get token info

Environment: ${Deno.env.get('NODE_ENV') || 'development'}
Runtime: Deno ${Deno.version.deno}
`);

Deno.serve({ port }, app.fetch);

console.log(`✅ Server is running on http://localhost:${port}\n`);
