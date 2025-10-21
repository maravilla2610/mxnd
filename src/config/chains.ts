export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  mxndContract: string;
  explorer: string;
}

export const SUPPORTED_CHAINS = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: Deno.env.get('ETHEREUM_RPC_URL') || 'https://eth.drpc.org',
    mxndContract: '0xC60bcA6bd5790611b8a302d4c5dF37D769C81121',
    explorer: 'https://etherscan.io'
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: Deno.env.get('POLYGON_RPC_URL') || 'https://polygon-rpc.com',
    mxndContract: '0xf48017f7fbF3FC97C1c0237Ee51809F90338925F',
    explorer: 'https://polygonscan.com'
  },
  avalanche: {
    name: 'Avalanche',
    chainId: 43114,
    rpcUrl: Deno.env.get('AVALANCHE_RPC_URL') || 'https://api.avax.network/ext/bc/C/rpc',
    mxndContract: '0xD3eE4C575a2Db1b6077158210bfeE33c73Ac49C1',
    explorer: 'https://snowtrace.io'
  },
  bitcoin: {
    name: 'Bitcoin',
    chainId: 0,
    rpcUrl: 'https://blockstream.info/api',
    mxndContract: '',
    explorer: 'https://www.blockchain.com/btc'
  }
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export function isValidChain(chain: string): chain is SupportedChain {
  return chain in SUPPORTED_CHAINS;
}

export function getChainConfig(chain: SupportedChain): ChainConfig {
  return SUPPORTED_CHAINS[chain];
}

// ERC-20 ABI for MXND token operations
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];
