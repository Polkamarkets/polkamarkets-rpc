import { Request, Response } from 'express';
import { ExecuteDTO } from './ExecuteDTO';

import { ExecuteUseCase } from './ExecuteUseCase';
import { EncryptionService } from '../../services/Encryption';
import { getNetworkConfigOrThrow } from '@config/Networks';

export class ExecuteController {
  constructor(private executeUseCase: ExecuteUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args, address, privateKey, timestamp, networkId } = request.body;
    if (networkId === undefined || networkId === null) {
      return response.status(400).json({ message: 'networkId is required' });
    }

    const encryptionService = new EncryptionService();
    // validate and set network
    const parsedNetworkId = parseInt(networkId as string);
    try { getNetworkConfigOrThrow(parsedNetworkId); } catch (e:any) { return response.status(400).json({ message: e.message }); }
    this.executeUseCase.contractProvider.useNetwork(parsedNetworkId);
    // decrypt private key and validate timestamp
    const decryptedPrivateKey = encryptionService.decrypt(privateKey);
    const decryptedTimestamp = encryptionService.decrypt(timestamp);

    // if decrypted timestamp is older than env variable, return 403
    if (Date.now() - Number(decryptedTimestamp) > (Number(process.env.ENCRYPT_TIMESTAMP_DIFF_MILISECONDS || 30000))) {
      return response.status(403).json({
        message: 'Invalid timestamp'
      });
    }

    for(let providerIndex = 0; providerIndex < this.executeUseCase.contractProvider.web3Providers.length; providerIndex++) {
      try {
        let data = await this.executeUseCase.execute({
          contract,
          method,
          address,
          networkId,
          privateKey: decryptedPrivateKey,
          providerIndex,
          args: args || [],
        } as ExecuteDTO);

        if (typeof data === 'boolean' || typeof data === 'string') {
          return response.status(200).json(data);
        }

        return response.status(200).json(data);
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === this.executeUseCase.contractProvider.web3Providers.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }

    return response.status(500).json({ message: 'Unexpected server error' });
  }
}
