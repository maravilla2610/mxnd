# MXND Backend API (Deno)

RESTful API backend for creating, managing, and sending MXND stablecoin across Ethereum, Polygon, and Avalanche using Tether's WDK - **powered by Deno**.

## Features

- 🦕 **Deno Runtime** - Secure by default, modern JavaScript/TypeScript runtime
- 🔐 **Multi-chain wallet management** - Create wallets that work across Ethereum, Polygon, and Avalanche
- 💰 **MXND token operations** - Check balances and transfer MXND tokens
- ⛽ **Gas estimation** - Get accurate gas cost estimates before transactions
- 🚀 **Modern stack** - Built with Hono, TypeScript, and Tether WDK
- 📡 **RESTful API** - Clean, well-documented endpoints
- 📚 **OpenAPI/Swagger** - Interactive API documentation with Swagger UI

## MXND Contract Addresses

- **Ethereum**: `0xC60bcA6bd5790611b8a302d4c5dF37D769C81121`
- **Polygon**: `0xf48017f7fbF3FC97C1c0237Ee51809F90338925F`
- **Avalanche**: `0xD3eE4C575a2Db1b6077158210bfeE33c73Ac49C1`

## Prerequisites

- [Deno](https://deno.land/) 1.40+

## Installation

```bash
# Install Deno (if not already installed)
curl -fsSL https://deno.land/install.sh | sh

# Or using Homebrew on macOS
brew install deno

# Or using PowerShell on Windows
irm https://deno.land/install.ps1 | iex
```

## Quick Start

```bash
# Start development server with hot reload
deno task dev

# Or run directly
deno run --allow-net --allow-read --allow-env --watch src/index.ts
```

The API will be available at `http://localhost:3000`

### 📚 API Documentation

Once the server is running, access the interactive documentation:

- **Swagger UI**: [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **OpenAPI JSON**: [http://localhost:3000/doc](http://localhost:3000/doc)

The Swagger UI provides an interactive interface to explore and test all API endpoints.

## Available Tasks

```bash
deno task dev      # Start development server with watch mode
deno task start    # Start production server
deno task check    # Type-check the application
deno task fmt      # Format code with Deno formatter
deno task lint     # Lint code with Deno linter
```

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

### Balance Queries

#### Get Balance on Specific Chain
```http
GET /api/v1/balance/:chain/:walletId
```

**Parameters:**
- `chain`: `ethereum`, `polygon`, or `avalanche`
- `walletId`: Your wallet ID

#### Get Balances on All Chains
```http
GET /api/v1/balance/:walletId
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

### Using Deno's fetch

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

## Project Structure

```
mxnd-backend/
├── src/
│   ├── config/
│   │   └── chains.ts          # Chain configurations & MXND addresses
│   ├── services/
│   │   ├── wallet.service.ts  # WDK wallet management
│   │   └── mxnd.service.ts    # MXND ERC-20 operations
│   ├── routes/
│   │   ├── wallet.routes.ts   # Wallet endpoints
│   │   ├── balance.routes.ts  # Balance endpoints
│   │   └── transfer.routes.ts # Transfer endpoints
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   └── index.ts               # Hono app entry point
├── deno.json                  # Deno configuration & tasks
└── .env                       # Environment variables
```

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

## Why Deno?

### Advantages over Node.js

1. **Security First** - Explicit permissions (--allow-net, --allow-env, etc.)
2. **Modern Standards** - Native TypeScript, ES modules, Web APIs
3. **No node_modules** - Uses URLs and import maps
4. **Built-in Tools** - Formatter, linter, test runner included
5. **Better Performance** - V8 optimizations and modern runtime
6. **Simplified Deployment** - Single executable compilation

### Deno Permissions

This API requires:
- `--allow-net` - Network access for HTTP server and RPC calls
- `--allow-read` - Read .env file
- `--allow-env` - Access environment variables

## Security Considerations

⚠️ **Important Security Notes:**

1. **Seed Phrase Storage**: This demo stores seed phrases in memory. In production:
   - Encrypt seed phrases before storing
   - Use HSM (Hardware Security Module) or KMS (Key Management Service)
   - Never log or expose seed phrases in responses
   - Implement proper access controls

2. **API Authentication**: Add authentication middleware before deploying

3. **Rate Limiting**: Implement rate limiting to prevent abuse

4. **HTTPS**: Always use HTTPS in production

## Deployment

### Deploy to Deno Deploy

```bash
# Install deployctl
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy
deployctl deploy --project=mxnd-backend src/index.ts
```

### Build Standalone Executable

```bash
# Compile to standalone binary
deno compile --allow-net --allow-read --allow-env --output mxnd-backend src/index.ts

# Run the binary
./mxnd-backend
```

## Tech Stack

- **[Deno](https://deno.land/)** - Secure JavaScript/TypeScript runtime
- **[Hono](https://hono.dev/)** - Ultra-fast web framework
- **[Tether WDK](https://docs.wallet.tether.io/)** - Wallet Development Kit
- **[Ethers.js](https://docs.ethers.org/)** - Ethereum library
- **TypeScript** - Type safety

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

## Troubleshooting

### Permission Denied Errors
Make sure you're running with the correct permissions:
```bash
deno run --allow-net --allow-read --allow-env src/index.ts
```

### Import Errors
Run `deno cache src/index.ts` to download and cache all dependencies.

### Type Errors
Run `deno task check` to see detailed type errors.

## Contributing

Contributions are welcome! Please ensure:
- Code follows Deno and TypeScript best practices
- Run `deno task fmt` before committing
- Run `deno task lint` to check for issues
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
- [Deno Documentation](https://deno.land/manual)

---

**⚠️ Disclaimer**: This is example code for educational purposes. Always conduct thorough security audits before deploying to production with real funds.
