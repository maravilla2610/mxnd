export interface WalletInfo {
  id: string;
  addresses: {
    ethereum: string;
    polygon: string;
    avalanche: string;
  };
  createdAt: string;
}

export interface CreateWalletRequest {
  name?: string;
}

export interface CreateWalletResponse {
  walletId: string;
  seedPhrase: string;
  addresses: {
    ethereum: string;
    polygon: string;
    avalanche: string;
  };
  warning: string;
}
