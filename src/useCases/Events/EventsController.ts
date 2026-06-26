import { Request, Response } from 'express';
import { EventsDTO } from './EventsDTO';

import { EventsUseCase } from './EventsUseCase';
import { PolkamarketsContractProvider } from '@providers/implementations/PolkamarketsContractProvider';
import { getNetworkConfigOrThrow } from '@config/Networks';

export class EventsController {
  constructor(private eventsUseCase: EventsUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, eventName, filter, address, fromBlock, toBlock, networkId } = request.query;
    if (networkId === undefined || networkId === null) {
      return response.status(400).json({ message: 'networkId is required' });
    }
    const parsedNetworkId = parseInt(networkId as string);
    if (Number.isNaN(parsedNetworkId)) {
      return response.status(400).json({ message: 'networkId must be a number' });
    }

    // validate and set network
    try { getNetworkConfigOrThrow(parsedNetworkId); } catch (e:any) { return response.status(400).json({ message: e.message }); }
    // per-request provider: a shared instance would let concurrent requests for
    // different networks overwrite each other's network state across awaits
    const contractProvider = new PolkamarketsContractProvider();
    contractProvider.useNetwork(parsedNetworkId);

    for(let providerIndex = 0; providerIndex < contractProvider.web3EventsProviders.length; providerIndex++) {
      try {
        const data = await this.eventsUseCase.execute(contractProvider, {
          contract,
          eventName,
          address,
          providerIndex,
          fromBlock,
          toBlock,
          networkId: parsedNetworkId,
          filter: filter ? JSON.parse(filter as string) : {}
        } as EventsDTO);

        if (typeof data === 'boolean') {
          return response.status(200).send(data);
        }

        return response.status(200).send(Object.values(data));
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === contractProvider.web3EventsProviders.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }

    return response.status(500).json({ message: 'Unexpected server error' });
  }

}
