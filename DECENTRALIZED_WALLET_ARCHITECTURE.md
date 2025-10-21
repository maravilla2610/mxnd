# Decentralized Wallet Architecture

## Overview

This implementation uses **Shamir's Secret Sharing Scheme (SSSS)** to create a truly decentralized wallet solution while maintaining excellent UX for merchants accepting crypto payments.

## Key Features

### 1. **Decentralized Key Management**
- **No single point of failure**: Private keys are never stored in one location
- **Merchant sovereignty**: Merchants maintain control over 2 of 5 key shares
- **Backend redundancy**: Backend stores 2 encrypted shares for recovery assistance
- **Optional custody**: 5th share can be held by trusted third-party or hardware wallet

### 2. **Shamir Secret Sharing (3-of-5 Threshold)**

**Total Shares**: 5
**Threshold**: 3 (need any 3 shares to reconstruct the wallet)

**Distribution**:
- **Share 1**: Merchant's device (local storage/secure enclave)
- **Share 2**: Merchant's backup (encrypted email/cloud)
- **Share 3**: Backend encrypted storage (primary)
- **Share 4**: Backend encrypted storage (redundancy)
- **Share 5**: Optional third-party custody or hardware wallet

### 3. **Multi-Currency Support**

Merchants can accept payments in multiple tokens:
- **USDT** (Tether)
- **USDC** (USD Coin)
- **DAI** (Dai Stablecoin)
- **WETH** (Wrapped Ether)
- **WBTC** (Wrapped Bitcoin)
- Any ERC-20 token on Polygon

## Security Architecture

### Wallet Creation Flow

1. **Generate 24-word BIP39 seed phrase** (256-bit entropy)
2. **Split into 5 Shamir shares** with 3-of-5 threshold
3. **Encrypt backend shares** (shares 3 & 4) with AES-256-CBC
4. **Store in database**: Encrypted shares + metadata
5. **Return to merchant**: Shares 1 & 2 for client-side storage

### Recovery Scenarios

| Scenario | Available Shares | Can Recover? |
|----------|-----------------|--------------|
| Lost device | Share 2 (backup) + Backend (3,4) | ✅ Yes (3 shares) |
| Lost backup | Share 1 (device) + Backend (3,4) | ✅ Yes (3 shares) |
| Backend breach | Shares 1,2 (merchant) + Share 5 | ✅ Yes (3 shares) |
| Lost device + backup | Backend (3,4) + Share 5 | ✅ Yes (3 shares) |
| Lost 3+ shares | < 3 shares available | ❌ No recovery |

### Encryption Details

- **Algorithm**: AES-256-CBC
- **Key Derivation**: scrypt with unique salts per share
- **IV**: Random 16-byte initialization vector per encryption
- **Format**: `${iv}:${encrypted_data}` (hex encoded)

## Database Schema

### `wallets` Table
```sql
- key_management: 'shamir' | 'custodial' | 'mpc'
- backend_share_1: TEXT (encrypted)
- backend_share_2: TEXT (encrypted)
- share_threshold: INTEGER (default: 3)
- total_shares: INTEGER (default: 5)
```

### `key_shares` Table
```sql
- wallet_address: STRING
- share_index: INTEGER (0-4)
- encrypted_share: TEXT
- location: 'backend' | 'merchant_device' | 'merchant_backup' | 'third_party'
- metadata: JSON
- last_accessed_at: TIMESTAMP
```

### `transactions` Table (Enhanced for Multi-Currency)
```sql
- token: STRING (e.g., 'USDT', 'USDC')
- token_address: STRING (ERC-20 contract address)
- chain: STRING (e.g., 'polygon', 'ethereum')
- fiat_value: DECIMAL (USD equivalent at tx time)
- fiat_currency: STRING (default: 'USD')
```

## API Endpoints

### Authentication & Onboarding

**POST /api/v1/auth/request-otp**
```json
Request: { "phone": "+521234567890" }
Response: { "success": true, "message": "OTP sent" }
```

**POST /api/v1/auth/verify-otp**
```json
Request: { "phone": "+521234567890", "code": "123456" }
Response: {
  "token": "...",
  "user": {
    "id": "uuid",
    "phone": "+521234567890",
    "wallet_address": "0x..."
  },
  "recovery": {
    "merchantShare": "801...",
    "merchantBackupShare": "802...",
    "recoveryQR": "{\"share\":\"801...\"}",
    "recoveryEmail": "{\"shares\":[\"801...\",\"802...\"]}"
  }
}
```

### Wallet Management

**GET /api/v1/wallet/address**
```json
Headers: Authorization: Bearer <token>
Response: { "address": "0xABCD...", "network": "polygon" }
```

**GET /api/v1/wallet/balances**
```json
Headers: Authorization: Bearer <token>
Response: {
  "balances": [
    {
      "token": "USDT",
      "symbol": "USDT",
      "balance": "125.50",
      "decimals": 6,
      "tokenAddress": "0xc213...",
      "chain": "polygon",
      "usdValue": "125.50"
    }
  ],
  "totalUsdValue": "125.50"
}
```

**GET /api/v1/wallet/transactions**
```json
Headers: Authorization: Bearer <token>
Response: {
  "transactions": [
    {
      "tx_hash": "0x123...",
      "timestamp": "2025-01-15T10:30:00Z",
      "type": "receive",
      "from": "0xABC...",
      "to": "0xDEF...",
      "amount": "50.00",
      "token": "USDT",
      "token_address": "0xc213...",
      "chain": "polygon",
      "status": "confirmed",
      "fiat_value": "50.00",
      "fiat_currency": "USD"
    }
  ]
}
```

### Recovery

**POST /api/v1/recovery/wallet**
```json
Headers: Authorization: Bearer <token>
Request: { "merchantShares": ["801...", "802..."] }
Response: {
  "success": true,
  "address": "0xABCD...",
  "message": "Wallet recovered successfully"
}
```

**GET /api/v1/recovery/share-info**
```json
Headers: Authorization: Bearer <token>
Response: {
  "address": "0xABCD...",
  "key_management": "shamir",
  "total_shares": 5,
  "threshold": 3,
  "shares_held": {
    "merchant_device": 1,
    "merchant_backup": 1,
    "backend": 2,
    "third_party": 1
  }
}
```

## UX Considerations

### For Merchants

1. **Onboarding** (First-time user):
   - Enter phone number
   - Verify OTP code
   - **Receive 2 shares**:
     - Share 1: Auto-saved to device secure storage
     - Share 2: Sent via encrypted email for backup
   - QR code displayed for Share 1 (can screenshot)

2. **Daily Operations**:
   - No seed phrase management needed
   - Just login with OTP
   - Accept payments seamlessly

3. **Recovery** (Lost device):
   - Login with OTP on new device
   - Provide backup share from email
   - Backend automatically provides 2 shares
   - Wallet reconstructed instantly

### Client App Requirements

**Must Store Securely**:
- Merchant's primary share (Share 1)
- Use device keychain/secure enclave

**Should Send to Merchant**:
- Backup share (Share 2) via encrypted email
- Recovery QR code (can be printed)

**Display to Merchant**:
- "Your wallet is protected by 5 key shares"
- "You control 2 shares, we help with 2, optional 3rd party has 1"
- "Need any 3 shares to recover"

## Advantages Over Traditional Solutions

### vs. Full Custodial
- ✅ Merchant maintains sovereignty (controls 2/5 shares)
- ✅ We can't unilaterally access funds (need merchant's shares)
- ✅ Regulatory compliance (not a custodian)

### vs. Full Self-Custody
- ✅ Better UX (no seed phrase memorization)
- ✅ Assisted recovery (backend provides shares)
- ✅ Multi-device support
- ✅ No single point of failure

### vs. MPC Wallets
- ✅ Simpler implementation
- ✅ Lower computational overhead
- ✅ Transparent security model
- ✅ No complex threshold signatures needed for recovery

## Production Considerations

### Security Enhancements

1. **Hardware Security Modules (HSM)**: Store backend shares in HSM
2. **Key Rotation**: Periodic re-sharing with new shares
3. **Biometric Auth**: Require fingerprint/Face ID to access Share 1
4. **Email Encryption**: PGP encrypt Share 2 before sending

### Operational

1. **Redis**: Move OTP storage from memory to Redis
2. **KMS**: Use AWS KMS or Google Cloud KMS for encryption keys
3. **Monitoring**: Alert on recovery attempts
4. **Rate Limiting**: Prevent brute force on OTP/recovery

### Compliance

1. **AML/KYC**: Integrate identity verification for larger merchants
2. **Transaction Monitoring**: Flag suspicious patterns
3. **Audit Logs**: Record all share access attempts

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ENCRYPTION_KEY=your-32-byte-hex-secret-key
WEBHOOK_API_KEY=your-webhook-secret
POLYGON_RPC_URL=https://polygon-rpc.com
```

## Migration Guide

If you have existing custodial wallets, you can migrate:

1. Export existing private key
2. Convert to BIP39 seed phrase
3. Split into Shamir shares
4. Distribute shares to merchant
5. Update database with share data
6. Delete original private key

## Testing Recovery

```bash
# Scenario 1: Lost device (using backup + backend shares)
curl -X POST http://localhost:3000/api/v1/recovery/wallet \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"merchantShares": ["802...BACKUP_SHARE"]}'

# Backend automatically provides shares 3 & 4
# Total: 3 shares → Recovery succeeds ✅
```

## References

- [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing)
- [BIP39 Mnemonic](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [EIP-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
