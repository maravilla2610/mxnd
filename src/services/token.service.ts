import { Contract, formatUnits, JsonRpcProvider, parseUnits } from 'ethers';
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { WalletService } from './wallet.service.ts';
import { getChainConfig, ERC20_ABI, type SupportedChain, SUPPORTED_CHAINS } from '../config/chains.ts';
import type {
  TokenBalanceResponse,
  TokenTransferParams,
  TokenTransferWithSeedParams,
  TokenTransferResponse
} from '../types/index.ts';

export class TokenService {
  /**
   * Initialize WDK instance from seed phrase
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
   * Get token info for a specific chain and token address
   */
  private static async getTokenInfoForChain(
    chain: SupportedChain,
    tokenAddress: string
  ): Promise<{
    symbol: string;
    decimals: number;
    name?: string;
  }> {
    const chainConfig = getChainConfig(chain);
    const provider = new JsonRpcProvider(chainConfig.rpcUrl);

    const tokenContract = new Contract(tokenAddress, [
      ...ERC20_ABI,
      'function name() view returns (string)'
    ], provider);

    // Make calls sequentially to avoid batch request limits on free tier RPC
    const decimals = await tokenContract.decimals();
    const symbol = await tokenContract.symbol();
    let name: string | undefined;
    try {
      name = await tokenContract.name();
    } catch {
      name = undefined;
    }

    return {
      symbol,
      decimals: Number(decimals),
      name
    };
  }

  /**
   * Get balance of any ERC-20 token
   */
  static async getBalance(
    walletId: string,
    chain: SupportedChain,
    tokenAddress: string
  ): Promise<TokenBalanceResponse> {
    const account = await WalletService.getAccount(walletId, chain);
    const address = await account.getAddress();

    // Get balance using WDK and token info
    const [balance, tokenInfo] = await Promise.all([
      account.getTokenBalance(tokenAddress),
      this.getTokenInfoForChain(chain, tokenAddress)
    ]);

    const formatted = formatUnits(balance, tokenInfo.decimals);

    return {
      chain,
      address,
      tokenAddress,
      balance: balance.toString(),
      decimals: tokenInfo.decimals,
      symbol: tokenInfo.symbol,
      formatted,
      name: tokenInfo.name
    };
  }

  /**
   * Get balance of any ERC-20 token using seed phrase
   */
  static async getBalanceWithSeed(
    seedPhrase: string,
    chain: SupportedChain,
    tokenAddress: string
  ): Promise<TokenBalanceResponse> {
    console.log('Getting balance with seed...');
    const wdk = this.initializeWDK(seedPhrase);
    const account = await wdk.getAccount(chain, 0);
    const address = await account.getAddress();
    console.log('Account address:', address);

    // Get balance using WDK and token info
    const [balance, tokenInfo] = await Promise.all([
      account.getTokenBalance(tokenAddress),
      this.getTokenInfoForChain(chain, tokenAddress)
    ]);

    const formatted = formatUnits(balance, tokenInfo.decimals);

    return {
      chain,
      address,
      tokenAddress,
      balance: balance.toString(),
      decimals: tokenInfo.decimals,
      symbol: tokenInfo.symbol,
      formatted,
      name: tokenInfo.name
    };
  }



  /**
   * Transfer any ERC-20 token
   */
  static async transfer(params: TokenTransferParams): Promise<TokenTransferResponse> {
    const { walletId, chain, tokenAddress, to, amount } = params;

    const account = await WalletService.getAccount(walletId, chain);
    const from = await account.getAddress();
    const chainConfig = getChainConfig(chain);

    // Get token decimals
    const tokenInfo = await this.getTokenInfoForChain(chain, tokenAddress);

    // Send transaction using the WDK account
    const tx = await account.transfer({
      token: tokenAddress,
      recipient: to,
      amount: parseUnits(amount, tokenInfo.decimals)
    });

    return {
      success: true,
      transactionHash: tx.hash,
      chain,
      from,
      to,
      amount,
      tokenAddress,
      explorerUrl: `${chainConfig.explorer}/tx/${tx.hash}`
    };
  }

  /**
   * Transfer any ERC-20 token using seed phrase
   */
  static async transferWithSeed(params: TokenTransferWithSeedParams): Promise<TokenTransferResponse> {
    const { seedPhrase, chain, tokenAddress, to, amount } = params;

    const wdk = this.initializeWDK(seedPhrase);
    const account = await wdk.getAccount(chain, 0);
    const from = await account.getAddress();
    const chainConfig = getChainConfig(chain);

    // Get token decimals first
    const tokenInfo = await this.getTokenInfoForChain(chain, tokenAddress);

    // Check token balance before transfer
    const balance = await account.getTokenBalance(tokenAddress);
    const transferAmount = parseUnits(amount, tokenInfo.decimals);

    if (balance < transferAmount) {
      throw new Error(`Insufficient token balance: have ${formatUnits(balance, tokenInfo.decimals)} ${tokenInfo.symbol}, need ${amount} ${tokenInfo.symbol}`);
    }

    // Check native token balance for gas
    const nativeBalance = await account.getBalance();
    const nativeTokenName = chain === 'ethereum' ? 'ETH' : chain === 'polygon' ? 'MATIC' : 'AVAX';
    if (nativeBalance === 0n) {
      throw new Error(`Insufficient gas funds: wallet has 0 ${nativeTokenName}. Please add ${nativeTokenName} to ${from} to pay for gas fees.`);
    }

    // Send transaction using the WDK account with correct decimals
    const tx = await account.transfer({
      token: tokenAddress,
      recipient: to,
      amount: parseUnits(amount, tokenInfo.decimals)
    });


    return {
      success: true,
      transactionHash: tx.hash,
      chain,
      from,
      to,
      amount,
      tokenAddress,
      explorerUrl: `${chainConfig.explorer}/tx/${tx.hash}`
    };
  }

  /**
   * Estimate gas cost for token transfer
   */
  static async estimateTransferCost(
    walletId: string,
    chain: SupportedChain,
    tokenAddress: string,
    to: string,
    amount: string
  ): Promise<{
    chain: SupportedChain;
    estimatedGas: string;
    gasPrice: string;
    estimatedCost: string;
    estimatedCostFormatted: string;
  }> {
    const account = await WalletService.getAccount(walletId, chain);

    // Get token decimals
    const tokenInfo = await this.getTokenInfoForChain(chain, tokenAddress);

    // Quote token transfer using WDK
    const transferQuote = await account.quoteTransfer({
      token: tokenAddress,
      recipient: to,
      amount: parseUnits(amount, tokenInfo.decimals)
    });

    const estimatedCostFormatted = formatUnits(transferQuote.fee, 18); // Native token has 18 decimals

    return {
      chain,
      estimatedGas: '0', // Not provided by quoteTransfer
      gasPrice: '0', // Not provided by quoteTransfer
      estimatedCost: transferQuote.fee.toString(),
      estimatedCostFormatted
    };
  }

  /**
   * Estimate gas cost for token transfer using seed phrase
   */
  static async estimateTransferCostWithSeed(
    seedPhrase: string,
    chain: SupportedChain,
    tokenAddress: string,
    to: string,
    amount: string
  ): Promise<{
    chain: SupportedChain;
    estimatedGas: string;
    gasPrice: string;
    estimatedCost: string;
    estimatedCostFormatted: string;
  }> {
    const wdk = this.initializeWDK(seedPhrase);
    const account = await wdk.getAccount(chain, 0);

    // Get token decimals
    const tokenInfo = await this.getTokenInfoForChain(chain, tokenAddress);

    // Quote token transfer using WDK
    const transferQuote = await account.quoteTransfer({
      token: tokenAddress,
      recipient: to,
      amount: parseUnits(amount, tokenInfo.decimals)
    });

    const estimatedCostFormatted = formatUnits(transferQuote.fee, 18); // Native token has 18 decimals

    return {
      chain,
      estimatedGas: '0', // Not provided by quoteTransfer
      gasPrice: '0', // Not provided by quoteTransfer
      estimatedCost: transferQuote.fee.toString(),
      estimatedCostFormatted
    };
  }

  /**
   * Get token info for any ERC-20 token
   */
  static async getTokenInfo(
    chain: SupportedChain,
    tokenAddress: string
  ): Promise<{
    symbol: string;
    decimals: number;
    name?: string;
  }> {
    const chainConfig = getChainConfig(chain);

    // Create a temporary WDK instance for read-only operation
    const WDK = (await import('@tetherto/wdk')).default;
    const WalletManagerEvm = (await import('@tetherto/wdk-wallet-evm')).default;

    const tempSeed = WDK.getRandomSeedPhrase();
    const wdk = new WDK(tempSeed);
    wdk.registerWallet(chain, WalletManagerEvm, { provider: chainConfig.rpcUrl });

    const account = await wdk.getAccount(chain, 0);
    const provider = (account as any).provider;

    const tokenContract = new Contract(tokenAddress, [
      ...ERC20_ABI,
      'function name() view returns (string)'
    ], provider);

    try {
      const [symbol, decimals, name] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.name().catch(() => undefined)
      ]);

      return {
        symbol,
        decimals: Number(decimals),
        name
      };
    } catch (error) {
      throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
