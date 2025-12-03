import { Request, Response } from 'express';
import { CallDTO } from './CallDTO';

import { CallUseCase } from './CallUseCase';
import { getNetworkConfigOrThrow } from '@config/Networks';

export class CallController {
  constructor(private callUseCase: CallUseCase) {}

  private parseArguments(argsString: string): any[] {
    if (!argsString) return [];

    const args: any[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      // Handle string delimiters
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === stringChar && inString) {
        // Check if it's escaped
        if (i > 0 && argsString[i - 1] === '\\') {
          current += char;
        } else {
          inString = false;
          stringChar = '';
          current += char;
        }
      } else if (inString) {
        current += char;
      } else {
        // Not in string, handle JSON brackets/braces
        if (char === '[' || char === '{') {
          depth++;
          current += char;
        } else if (char === ']' || char === '}') {
          depth--;
          current += char;
        } else if (char === ',' && depth === 0) {
          // Top-level comma - split here
          args.push(this.parseArgument(current.trim()));
          current = '';
        } else {
          current += char;
        }
      }
    }

    // Add the last argument
    if (current.trim()) {
      args.push(this.parseArgument(current.trim()));
    }

    return args;
  }

  private parseArgument(arg: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(arg);
    } catch {
      // If JSON parsing fails, return as string
      return arg;
    }
  }

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, method, args, address, networkId } = request.query;
    if (networkId === undefined || networkId === null) {
      return response.status(400).json({ message: 'networkId is required' });
    }
    const parsedNetworkId = parseInt(networkId as string);
    if (Number.isNaN(parsedNetworkId)) {
      return response.status(400).json({ message: 'networkId must be a number' });
    }

    // validate and set network
    try { getNetworkConfigOrThrow(parsedNetworkId); } catch (e:any) { return response.status(400).json({ message: e.message }); }
    this.callUseCase.contractProvider.useNetwork(parsedNetworkId);

    for(let providerIndex = 0; providerIndex < this.callUseCase.contractProvider.web3Providers.length; providerIndex++) {
      try {
        let data = await this.callUseCase.execute({
          contract,
          method,
          address,
          networkId: parsedNetworkId,
          providerIndex,
          args: this.parseArguments(args as string)
        } as CallDTO);

        if (typeof data === 'boolean' || typeof data === 'string') {
          return response.status(200).send(data);
        }

        return response.status(200).send(Object.values(data));
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === this.callUseCase.contractProvider.web3Providers.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }

    return response.status(500).json({ message: 'Unexpected server error' });
  }
}
