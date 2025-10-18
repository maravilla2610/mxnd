import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { SUPPORTED_CHAINS, type SupportedChain } from '../config/chains.ts';
import { randomBytes } from 'node:crypto';

// In-memory storage for demo purposes
// In production, use encrypted database storage
const walletStore = new Map<string, { seedPhrase: string; createdAt: string }>();

export class WalletService {
  /**
   * Create a new wallet with WDK across all supported chains
   */
  static async createWallet(): Promise<{
    walletId: string;
    seedPhrase: string;
    addresses: Record<SupportedChain, string>;
  }> {
    // Generate seed phrase
    const seedPhrase = WDK.getRandomSeedPhrase();

    // Generate unique wallet ID
    const walletId = randomBytes(16).toString('hex');

    // Initialize WDK with all chains
    const wdk = this.initializeWDK(seedPhrase);

    // Get addresses for all chains
    const addresses: any = {};

    for (const chain of Object.keys(SUPPORTED_CHAINS) as SupportedChain[]) {
      const account = await wdk.getAccount(chain, 0);
      addresses[chain] = await account.getAddress();
    }

    // Store wallet (in production, encrypt the seed phrase!)
    walletStore.set(walletId, {
      seedPhrase,
      createdAt: new Date().toISOString()
    });

    return {
      walletId,
      seedPhrase,
      addresses
    };
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
    const addresses: any = {};

    for (const chain of Object.keys(SUPPORTED_CHAINS) as SupportedChain[]) {
      const account = await wdk.getAccount(chain, 0);
      addresses[chain] = await account.getAddress();
    }

    return addresses;
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
   * Initialize WDK with all supported EVM chains
   */
  private static initializeWDK(seedPhrase: string): WDK {
    const wdk = new WDK(seedPhrase);

    // Register all EVM chains
    for (const [chainKey, config] of Object.entries(SUPPORTED_CHAINS)) {
      wdk.registerWallet(chainKey, WalletManagerEvm, {
        provider: config.rpcUrl
      });
    }

    return wdk;
  }

  /**
   * Check if wallet exists
   */
  static walletExists(walletId: string): boolean {
    return walletStore.has(walletId);
  }

  /**
   * Get all wallet IDs (for debugging)
   */
  static getAllWalletIds(): string[] {
    return Array.from(walletStore.keys());
  }

  /**
   * Get wallet addresses from seed phrase directly
   */
  static async getAddressesFromSeedPhrase(seedPhrase: string): Promise<Record<SupportedChain, string>> {
    const wdk = this.initializeWDK(seedPhrase);
    const addresses: any = {};

    for (const chain of Object.keys(SUPPORTED_CHAINS) as SupportedChain[]) {
      const account = await wdk.getAccount(chain, 0);
      addresses[chain] = await account.getAddress();
    }

    return addresses;
  }
}
