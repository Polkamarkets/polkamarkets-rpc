import { Contract } from '@models/contract';

export interface ExecuteDTO {
  contract: Contract;
  method: any;
  args: any;
  address: any;
  providerIndex: any;
  privateKey: string;
  timestamp: string;
}
