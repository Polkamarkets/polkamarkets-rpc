export interface ContractProvider {
  getContract: (contract: string, address: string, providerIndex: number, privateKey?: string) => any;
  getContractEvents: (
    contract: string,
    address: string,
    providerIndex: number,
    eventName: string,
    filter: Object,
    fromBlock?: string,
    toBlock?: string
  ) => any;
  web3Providers: string[];
  web3EventsProviders: string[];
}
