import { Request, Response } from 'express';
import { EventsDTO } from './EventsDTO';

import { EventsUseCase } from './EventsUseCase';
import { getNetworkConfigOrThrow } from '@config/Networks';

import { EventsWorker } from '@workers/EventsWorker';
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
    this.eventsUseCase.contractProvider.useNetwork(parsedNetworkId);

    for(let providerIndex = 0; providerIndex < this.eventsUseCase.contractProvider.web3EventsProviders.length; providerIndex++) {
      try {
        const data = await this.eventsUseCase.execute({
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
        if (providerIndex === this.eventsUseCase.contractProvider.web3EventsProviders.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }

    return response.status(500).json({ message: 'Unexpected server error' });
  }

  async handleWorker(request: Request, response: Response): Promise<Response> {
    const { contract, eventName, filter, address } = request.query;

    EventsWorker.send(
      {
        contract,
        address,
        eventName,
        filter: filter ? JSON.parse(filter as string) : {}
      },
      {
        priority: 1
      }
    );

    return response.status(204).send(null);
  }
}
