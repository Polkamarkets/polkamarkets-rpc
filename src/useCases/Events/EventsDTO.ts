import { Contract } from '@models/contract';

export interface EventsDTO {
  contract: Contract;
  eventName: string;
  filter: {
    [key: string]: string;
  };
  address: string;
  providerIndex: any;
  fromBlock?: string;
  toBlock?: string;
}
