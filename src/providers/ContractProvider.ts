export interface ContractProvider {
  getContract: (contract: string, address: string, providerIndex: number, privateKey?: string) => any;
  getContractEvents: (
    contract: string,
    address: string,
    providerIndex: number,
    eventName: string,
    filter: Object,
    fromBlock?: string,
    toBlock?: string,
    networkId?: number
  ) => any;
  web3Providers: string[];
  web3EventsProviders: string[];
  useNetwork: (networkId: number) => void;
}
