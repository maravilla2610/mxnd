// Load environment variables from .env file FIRST
import '@std/dotenv/load';

import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { swaggerUI } from '@hono/swagger-ui';

// Import OpenAPI routes
import balanceRoutes from './routes/openapi/balance.routes.ts';
import transferRoutes from './routes/openapi/transfer.routes.ts';
import authRoutesOpenAPI from './routes/openapi/auth.routes.ts';
import merchantWalletRoutes from './routes/openapi/merchant-wallet.routes.ts';
import recoveryRoutesOpenAPI from './routes/openapi/recovery.routes.ts';

// Import regular routes (for webhooks - no OpenAPI needed)
import webhookRoutes from './routes/webhook.routes.ts';

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
      auth: '/api/v1/auth',
      wallet: '/api/v1/wallet',
      balance: '/api/v1/balance',
      transfer: '/api/v1/transfer',
      webhooks: '/api/v1/webhook',
      recovery: '/api/v1/recovery'
    }
  });
});

// API Routes (OpenAPI documented)
app.route('/api/v1/auth', authRoutesOpenAPI);
app.route('/api/v1/wallet', merchantWalletRoutes);
app.route('/api/v1/recovery', recoveryRoutesOpenAPI);

// Legacy OpenAPI routes (can be deprecated)
app.route('/api/v1/balance', balanceRoutes);
app.route('/api/v1/transfer', transferRoutes);

// Webhook routes (internal, no OpenAPI)
app.route('/api/v1/webhook', webhookRoutes);

// Override /doc endpoint to inject security schemes
app.get('/doc', (c) => {
  // Get the base OpenAPI document from registered routes
  const baseDoc = {
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
        name: 'Authentication',
        description: 'OTP-based authentication and user management'
      },
      {
        name: 'Merchant Wallet',
        description: 'Decentralized wallet operations for merchants - addresses, balances, transactions'
      },
      {
        name: 'Recovery',
        description: 'Wallet recovery using Shamir Secret Sharing (3-of-5 threshold)'
      },
      {
        name: 'Wallet',
        description: '[Legacy] Wallet management operations'
      },
      {
        name: 'Balance',
        description: '[Legacy] Balance queries'
      },
      {
        name: 'Transfer',
        description: '[Legacy] Transfer operations'
      }
    ],
    externalDocs: {
      description: 'Decentralized Wallet Architecture Documentation',
      url: 'https://github.com/yourusername/mxnd-backend/blob/main/DECENTRALIZED_WALLET_ARCHITECTURE.md'
    }
  };

  // Get generated document from OpenAPIHono
  const generatedDoc = app.getOpenAPIDocument(baseDoc);

  // Inject security schemes after generation
  generatedDoc.components = generatedDoc.components || {};
  generatedDoc.components.securitySchemes = {
    Bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  };

  return c.json(generatedDoc);
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
  🔐 Auth & Onboarding:
  • POST   /api/v1/auth/request-otp    - Request OTP for login
  • POST   /api/v1/auth/verify-otp     - Verify OTP and login (creates wallet)
  • GET    /api/v1/auth/profile        - Get user profile

  💼 Wallet Management (Decentralized):
  • GET    /api/v1/wallet/address      - Get wallet address (QR)
  • GET    /api/v1/wallet/balance      - Get USDT balance
  • GET    /api/v1/wallet/balances     - Get multi-currency balances
  • GET    /api/v1/wallet/transactions - Get transaction history

  🔑 Recovery (Shamir Secret Sharing):
  • POST   /api/v1/recovery/wallet     - Recover wallet with shares
  • GET    /api/v1/recovery/share-info - Get share distribution info

  🔔 Webhooks:
  • POST   /api/v1/webhook/usdt-incoming - Incoming payment notifications

Environment: ${Deno.env.get('NODE_ENV') || 'development'}
Runtime: Deno ${Deno.version.deno}
`);

Deno.serve({ port }, app.fetch);

console.log(`✅ Server is running on http://localhost:${port}\n`);
