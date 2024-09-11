import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  constructor(public contractProvider: ContractProvider) {}

  async execute({ contract, eventName, filter, address, providerIndex, fromBlock, toBlock }: EventsDTO) {
    const events = await this.contractProvider.getContractEvents(
      contract,
      address,
      providerIndex,
      eventName,
      filter,
      fromBlock,
      toBlock
    );

    return events;
  }
}
