import { Request, Response } from 'express';
import { ExecuteDTO } from './ExecuteDTO';

import { ExecuteUseCase } from './ExecuteUseCase';

export class ExecuteController {
  constructor(private executeUseCase: ExecuteUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args, address, privateKey } = request.body;

    for(let providerIndex = 0; providerIndex < this.executeUseCase.contractProvider.web3Providers.length; providerIndex++) {
      try {
        let data = await this.executeUseCase.execute({
          contract,
          method,
          address,
          privateKey,
          providerIndex,
          args: args || [],
        } as ExecuteDTO);

        if (typeof data === 'boolean' || typeof data === 'string') {
          return response.status(200).send(data);
        }

        return response.status(200).send(Object.values(data));
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === this.executeUseCase.contractProvider.web3Providers.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }
  }
}
