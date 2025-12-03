import { Contract } from '@models/contract';

export interface ExecuteDTO {
  contract: Contract;
  method: any;
  args: any;
  address: any;
  providerIndex: any;
  networkId: number;
  privateKey: string;
  timestamp: string;
}
