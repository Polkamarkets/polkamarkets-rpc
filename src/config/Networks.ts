export type BlockConfig = {
  fromBlock: number;
  blockCount: number;
  fallback?: boolean;
};

export type EtherscanConfig = {
  enabled: boolean;
  chainId: string;
};

export type NetworkConfig = {
  networkId: number;
  web3Providers: string[];
  web3EventsProviders?: string[];
  blockConfig?: BlockConfig;
  etherscan?: EtherscanConfig;
};

export function getNetworksConfig(): NetworkConfig[] {
  const raw = process.env.NETWORKS_CONFIG;
  if (!raw) {
    throw new Error('NETWORKS_CONFIG env var is required (multichain settings).');
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('NETWORKS_CONFIG must be a JSON array.');
  return parsed;
}

export function getNetworkConfigOrThrow(networkId: number): NetworkConfig {
  const list = getNetworksConfig();
  const cfg = list.find(n => Number(n.networkId) === Number(networkId));
  if (!cfg) {
    throw new Error(`Unsupported networkId: ${networkId}`);
  }
  return cfg;
}
