import { ContractProvider } from '@providers/ContractProvider';
import { EventsDTO } from './EventsDTO';

export class EventsUseCase {
  async execute(contractProvider: ContractProvider, { contract, eventName, filter, address, providerIndex, fromBlock, toBlock, networkId }: EventsDTO) {
    const events = await contractProvider.getContractEvents(
      contract,
      address,
      providerIndex,
      eventName,
      filter,
      fromBlock,
      toBlock,
      networkId
    );

    return events;
  }
}
