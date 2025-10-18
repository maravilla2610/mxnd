# MXND Backend API

RESTful API backend for creating, managing, and sending MXND stablecoin across Ethereum, Polygon, and Avalanche using Tether's WDK.

## Features

- 🔐 **Multi-chain wallet management** - Create wallets that work across Ethereum, Polygon, and Avalanche
- 💰 **MXND token operations** - Check balances and transfer MXND tokens
- ⛽ **Gas estimation** - Get accurate gas cost estimates before transactions
- 🚀 **Modern stack** - Built with Hono, TypeScript, and Tether WDK
- 📡 **RESTful API** - Clean, well-documented endpoints

## MXND Contract Addresses

- **Ethereum**: `0xC60bcA6bd5790611b8a302d4c5dF37D769C81121`
- **Polygon**: `0xf48017f7fbF3FC97C1c0237Ee51809F90338925F`
- **Avalanche**: `0xD3eE4C575a2Db1b6077158210bfeE33c73Ac49C1`

## Prerequisites

- Node.js 20+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

## API Endpoints

### Wallet Management

#### Create Wallet
```http
POST /api/v1/wallet
```

**Response:**
```json
{
  "walletId": "abc123...",
  "seedPhrase": "word1 word2 word3...",
  "addresses": {
    "ethereum": "0x...",
    "polygon": "0x...",
    "avalanche": "0x..."
  },
  "warning": "⚠️ STORE YOUR SEED PHRASE SECURELY!"
}
```

#### Get Wallet Info
```http
GET /api/v1/wallet/:walletId
```

**Response:**
```json
{
  "id": "abc123...",
  "addresses": {
    "ethereum": "0x...",
    "polygon": "0x...",
    "avalanche": "0x..."
  },
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Balance Queries

#### Get Balance on Specific Chain
```http
GET /api/v1/balance/:chain/:walletId
```

**Parameters:**
- `chain`: `ethereum`, `polygon`, or `avalanche`
- `walletId`: Your wallet ID

**Response:**
```json
{
  "chain": "ethereum",
  "address": "0x...",
  "balance": "1000000000000000000",
  "decimals": 18,
  "symbol": "MXND",
  "formatted": "1.0"
}
```

#### Get Balances on All Chains
```http
GET /api/v1/balance/:walletId
```

**Response:**
```json
{
  "walletId": "abc123...",
  "balances": {
    "ethereum": {
      "address": "0x...",
      "balance": "1.0",
      "raw": "1000000000000000000",
      "decimals": 18,
      "symbol": "MXND"
    },
    "polygon": { ... },
    "avalanche": { ... }
  }
}
```

### Transfers

#### Send MXND
```http
POST /api/v1/transfer
Content-Type: application/json

{
  "walletId": "abc123...",
  "chain": "ethereum",
  "to": "0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5",
  "amount": "1.5"
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "chain": "ethereum",
  "from": "0x...",
  "to": "0x...",
  "amount": "1.5",
  "explorerUrl": "https://etherscan.io/tx/0x..."
}
```

#### Get Transfer Quote (Gas Estimate)
```http
POST /api/v1/transfer/quote
Content-Type: application/json

{
  "walletId": "abc123...",
  "chain": "polygon",
  "to": "0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5",
  "amount": "1.5"
}
```

**Response:**
```json
{
  "chain": "polygon",
  "estimatedGas": "65000",
  "gasPrice": "30000000000",
  "estimatedCost": "1950000000000000",
  "estimatedCostFormatted": "0.00195"
}
```

## Example Usage

### Using cURL

```bash
# Create a wallet
curl -X POST http://localhost:3000/api/v1/wallet

# Get balance
curl http://localhost:3000/api/v1/balance/ethereum/YOUR_WALLET_ID

# Transfer MXND
curl -X POST http://localhost:3000/api/v1/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "walletId": "YOUR_WALLET_ID",
    "chain": "polygon",
    "to": "0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5",
    "amount": "10.0"
  }'
```

### Using JavaScript/TypeScript

```typescript
const API_URL = 'http://localhost:3000/api/v1';

// Create wallet
const wallet = await fetch(`${API_URL}/wallet`, {
  method: 'POST'
}).then(r => r.json());

console.log('Wallet ID:', wallet.walletId);
console.log('Seed Phrase:', wallet.seedPhrase);

// Check balance
const balance = await fetch(
  `${API_URL}/balance/ethereum/${wallet.walletId}`
).then(r => r.json());

console.log('Balance:', balance.formatted, balance.symbol);

// Transfer tokens
const transfer = await fetch(`${API_URL}/transfer`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletId: wallet.walletId,
    chain: 'ethereum',
    to: '0x742d35Cc6634C0532925a3b8D9C5c8b7b6e5f6e5',
    amount: '5.0'
  })
}).then(r => r.json());

console.log('Transaction:', transfer.explorerUrl);
```

## Architecture

```
src/
├── config/
│   └── chains.ts          # Chain configurations & MXND addresses
├── services/
│   ├── wallet.service.ts  # WDK wallet management
│   └── mxnd.service.ts    # MXND ERC-20 operations
├── routes/
│   ├── wallet.routes.ts   # Wallet endpoints
│   ├── balance.routes.ts  # Balance endpoints
│   └── transfer.routes.ts # Transfer endpoints
├── types/
│   └── index.ts           # TypeScript definitions
└── index.ts               # Hono app entry point
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Seed Phrase Storage**: This demo stores seed phrases in memory. In production:
   - Encrypt seed phrases before storing
   - Use HSM (Hardware Security Module) or KMS (Key Management Service)
   - Never log or expose seed phrases in responses
   - Implement proper access controls

2. **API Authentication**: Add authentication middleware before deploying:
   ```typescript
   // Example: API key authentication
   app.use('/api/*', async (c, next) => {
     const apiKey = c.req.header('X-API-Key');
     if (!apiKey || apiKey !== process.env.API_KEY) {
       return c.json({ error: 'Unauthorized' }, 401);
     }
     await next();
   });
   ```

3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: All user inputs are validated, but add additional checks as needed

## Environment Variables

Create a `.env` file:

```bash
# Server
PORT=3000
NODE_ENV=development

# RPC Endpoints (optional - defaults provided)
ETHEREUM_RPC_URL=https://eth.drpc.org
POLYGON_RPC_URL=https://polygon-rpc.com
AVALANCHE_RPC_URL=https://api.avax.network/ext/bc/C/rpc
```

## Tech Stack

- **[Hono](https://hono.dev/)** - Ultra-fast web framework
- **[Tether WDK](https://docs.wallet.tether.io/)** - Wallet Development Kit
- **[Ethers.js](https://docs.ethers.org/)** - Ethereum library
- **TypeScript** - Type safety
- **Node.js** - Runtime environment

## Development

```bash
# Watch mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { ... }
}
```

Common error codes:
- `WALLET_NOT_FOUND` - Wallet ID doesn't exist
- `INVALID_CHAIN` - Unsupported blockchain
- `TRANSFER_FAILED` - Transaction failed
- `INSUFFICIENT_BALANCE` - Not enough tokens/gas

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- All endpoints are documented
- Error handling is comprehensive
- Security considerations are addressed

## License

ISC

## Support

For issues or questions:
- [Tether WDK Documentation](https://docs.wallet.tether.io/)
- [Tether WDK Discord](https://discord.gg/arYXDhHB2w)
- [GitHub Issues](https://github.com/tetherto/wdk-core)

---

**⚠️ Disclaimer**: This is example code for educational purposes. Always conduct thorough security audits before deploying to production with real funds.
