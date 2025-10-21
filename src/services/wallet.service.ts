import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import { SUPPORTED_CHAINS, type SupportedChain, ERC20_ABI } from '../config/chains.ts';
import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';
import { Buffer } from 'node:buffer';
import prisma from '../../prisma/client.ts';
import { ethers } from 'ethers';
import { KeyShareService } from './key-share.service.ts';
import * as bip39 from 'bip39';

// In-memory storage for demo purposes
// In production, use encrypted database storage
const walletStore = new Map<string, { seedPhrase: string; createdAt: string }>();

export class WalletService {

  /**
   * Create a new decentralized wallet for a user (used during registration)
   * Uses Shamir's Secret Sharing to split the key across multiple locations
   */
  static async createWalletForUser(): Promise<{
    addresses: Record<SupportedChain, string>;
    primaryAddress: string;
    merchantShare: string;
    merchantBackupShare: string;
    recoveryQR: string;
    recoveryEmail: string;
  }> {
    // Generate seed phrase using BIP39
    const seedPhrase = bip39.generateMnemonic(256); // 24 words for better security

    // Initialize WDK with all supported chains
    const wdk = this.initializeWDK(seedPhrase);

    // Generate addresses for all supported chains
    const addresses: any = {};
    for (const chain of Object.keys(SUPPORTED_CHAINS) as SupportedChain[]) {
      const account = await wdk.getAccount(chain, 0);
      addresses[chain] = await account.getAddress();
    }

    // Use Polygon as primary address
    const primaryAddress = addresses.polygon;

    // Split seed phrase into Shamir shares
    const shareDistribution = KeyShareService.generateShareDistribution(seedPhrase);

    // Validate shares work correctly
    const isValid = KeyShareService.validateShares(
      [
        shareDistribution.merchantShare,
        shareDistribution.merchantBackupShare,
        KeyShareService.decryptShare(shareDistribution.backendShare1, 2)
      ],
      seedPhrase
    );

    if (!isValid) {
      throw new Error('Share validation failed - wallet creation aborted');
    }

    // Create recovery package for merchant
    const recoveryPackage = KeyShareService.createRecoveryPackage(
      shareDistribution.merchantShare,
      shareDistribution.merchantBackupShare
    );

    return {
      addresses,
      primaryAddress,
      merchantShare: shareDistribution.merchantShare,
      merchantBackupShare: shareDistribution.merchantBackupShare,
      recoveryQR: recoveryPackage.qrData,
      recoveryEmail: recoveryPackage.emailData
    };
  }

  /**
   * Store wallet with Shamir shares in database
   */
  static async storeWalletWithShares(
    userId: string,
    addresses: Record<SupportedChain, string>,
    primaryAddress: string,
    backendShare1: string,
    backendShare2: string,
    optionalShare: string
  ): Promise<void> {
    // Store primary wallet record (Polygon) with all chain addresses
    await prisma.wallets.create({
      data: {
        userId,
        address: primaryAddress,
        type: 'shamir-eoa',
        chain: 'polygon',
        keyManagement: 'shamir',
        backendShare1,
        backendShare2,
        shareThreshold: 3,
        totalShares: 5,
        chainAddresses: addresses as any // Store all chain addresses as JSON
      }
    });

    // Store individual share records for auditing (linked to primary address)
    await prisma.keyShares.createMany({
      data: [
        {
          walletAddress: primaryAddress,
          shareIndex: 2,
          encryptedShare: backendShare1,
          location: 'backend',
          metadata: JSON.stringify({ storage: 'primary', encrypted: true })
        },
        {
          walletAddress: primaryAddress,
          shareIndex: 3,
          encryptedShare: backendShare2,
          location: 'backend',
          metadata: JSON.stringify({ storage: 'redundancy', encrypted: true })
        },
        {
          walletAddress: primaryAddress,
          shareIndex: 4,
          encryptedShare: optionalShare,
          location: 'third_party',
          metadata: JSON.stringify({ storage: 'optional', encrypted: false })
        }
      ]
    });
  }


  /**
   * Get wallet addresses by wallet ID
   */
  static async getWalletAddresses(walletId: string): Promise<Record<SupportedChain, string>> {
    const wallet = walletStore.get(walletId);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const wdk = this.initializeWDK(wallet.seedPhrase);
    const addresses: Partial<Record<SupportedChain, string>> = {};

    for (const chain of Object.keys(SUPPORTED_CHAINS) as SupportedChain[]) {
      const account = await wdk.getAccount(chain, 0);
      addresses[chain] = await account.getAddress();
    }

    return addresses as Record<SupportedChain, string>;
  }

  /**
   * Get WDK instance for a specific wallet
   */
  static async getWDKInstance(walletId: string): Promise<WDK> {
    const wallet = walletStore.get(walletId);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return this.initializeWDK(wallet.seedPhrase);
  }

  /**
   * Get account for a specific chain
   */
  static async getAccount(walletId: string, chain: SupportedChain) {
    const wdk = await this.getWDKInstance(walletId);
    return wdk.getAccount(chain, 0);
  }

  /**
   * Initialize WDK with all supported chains (EVM + Bitcoin)
   */
  private static initializeWDK(seedPhrase: string): WDK {
    const wdk = new WDK(seedPhrase);

    // Register each chain with appropriate wallet manager
    for (const [chainKey, config] of Object.entries(SUPPORTED_CHAINS)) {
      if (chainKey === 'bitcoin') {
        // Bitcoin uses its own wallet manager
        // @ts-ignore: Ignore type mismatch 
        wdk.registerWallet(chainKey, WalletManagerBtc, {
          provider: config.rpcUrl
        });
      } else {
        // All other chains are EVM-compatible
        wdk.registerWallet(chainKey, WalletManagerEvm, {
          provider: config.rpcUrl
        });
      }
    }

    return wdk;
  }


  /**
   * Get wallet address for a user
   */
  static async getWalletAddress(userId: string): Promise<{ address: string; network: string }> {
    const wallet = await prisma.wallets.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      address: wallet.address,
      network: wallet.chain
    };
  }

  /**
   * Get all chain addresses for a user
   */
  static async getAllAddressesForUser(userId: string): Promise<{
    addresses: Record<SupportedChain, string>;
    primaryAddress: string;
  }> {
    const wallet = await prisma.wallets.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Extract addresses from JSON field
    if (wallet.chainAddresses) {
      return {
        addresses: wallet.chainAddresses as Record<SupportedChain, string>,
        primaryAddress: wallet.address
      };
    }

    // Fallback: return only the primary address
    return {
      addresses: { polygon: wallet.address } as Record<SupportedChain, string>,
      primaryAddress: wallet.address
    };
  }

  /**
   * Get USDT balance for a user's wallet
   */
  static async getBalance(userId: string): Promise<{ balance: string; token: string }> {
    const wallet = await prisma.wallets.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get chain config (default to Polygon)
    const chainConfig = SUPPORTED_CHAINS[wallet.chain as SupportedChain] || SUPPORTED_CHAINS.polygon;

    // Connect to provider
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    // USDT contract address on Polygon
    const usdtContractAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

    // Create contract instance
    const usdtContract = new ethers.Contract(usdtContractAddress, ERC20_ABI, provider);

    // Get balance
    const balanceWei = await usdtContract.balanceOf(wallet.address);
    const decimals = await usdtContract.decimals();

    // Format balance
    const balance = ethers.formatUnits(balanceWei, decimals);

    return {
      balance,
      token: 'USDT'
    };
  }

  /**
   * Get transaction history for a user (multi-currency support)
   */
  static async getTransactions(userId: string, limit: number = 20) {
    const transactions = await prisma.transactions.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return transactions.map(tx => ({
      tx_hash: tx.txHash,
      timestamp: tx.timestamp.toISOString(),
      type: tx.type,
      from: tx.fromAddress,
      to: tx.toAddress,
      amount: tx.amount.toString(),
      token: tx.token,
      token_address: tx.tokenAddress,
      chain: tx.chain,
      status: tx.status,
      fiat_value: tx.fiatValue?.toString(),
      fiat_currency: tx.fiatCurrency
    }));
  }

  /**
   * Recover wallet using merchant shares
   * Requires at least 3 shares to reconstruct the seed phrase
   */
  static async recoverWallet(userId: string, merchantShares: string[]): Promise<{
    success: boolean;
    address: string;
  }> {
    // Get wallet info from DB
    const wallet = await prisma.wallets.findUnique({
      where: { userId },
      include: { keyShares: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Decrypt backend shares
    const backendShare1 = KeyShareService.decryptShare(wallet.backendShare1!, 2);
    const backendShare2 = KeyShareService.decryptShare(wallet.backendShare2!, 3);

    // Combine merchant shares with backend shares
    const allShares = [...merchantShares, backendShare1];

    // Need at least threshold (3) shares
    if (allShares.length < (wallet.shareThreshold || 3)) {
      throw new Error('Not enough shares to recover wallet');
    }

    // Reconstruct seed phrase
    const seedPhrase = KeyShareService.reconstructSeedPhrase(allShares);

    // Verify the address matches
    const wdk = this.initializeWDK(seedPhrase);
    const account = await wdk.getAccount('polygon', 0);
    const recoveredAddress = await account.getAddress();

    if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
      throw new Error('Recovered address does not match - invalid shares');
    }

    return {
      success: true,
      address: recoveredAddress
    };
  }

  /**
   * Get multi-currency balance for a user's wallet
   */
  static async getMultiCurrencyBalance(userId: string): Promise<{
    balances: Array<{
      token: string;
      symbol: string;
      balance: string;
      decimals: number;
      tokenAddress: string;
      chain: string;
      usdValue?: string;
    }>;
    totalUsdValue: string;
  }> {
    const wallet = await prisma.wallets.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Common stablecoins and tokens on Polygon
    const tokens = [
      {
        symbol: 'USDT',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6
      },
      {
        symbol: 'USDC',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6
      },
      {
        symbol: 'DAI',
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        decimals: 18
      },
      {
        symbol: 'WETH',
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        decimals: 18
      },
      {
        symbol: 'WBTC',
        address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        decimals: 8
      }
    ];

    const chainConfig = SUPPORTED_CHAINS.polygon;
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    const balances = [];
    let totalUsdValue = 0;

    for (const token of tokens) {
      const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
      const balanceWei = await contract.balanceOf(wallet.address);
      const balance = ethers.formatUnits(balanceWei, token.decimals);

      // Only include if balance > 0
      if (parseFloat(balance) > 0) {
        balances.push({
          token: token.symbol,
          symbol: token.symbol,
          balance,
          decimals: token.decimals,
          tokenAddress: token.address,
          chain: 'polygon',
          usdValue: balance // Simplified - in production, fetch real prices
        });

        totalUsdValue += parseFloat(balance);
      }
    }

    return {
      balances,
      totalUsdValue: totalUsdValue.toFixed(2)
    };
  }
}
