import { Contract } from '@models/contract';

export interface CallDTO {
  contract: Contract;
  method: any;
  args: any;
  address: any;
  providerIndex: any;
  networkId: number;
}
