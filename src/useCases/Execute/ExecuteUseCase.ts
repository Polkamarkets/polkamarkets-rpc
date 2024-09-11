import { ContractProvider } from '@providers/ContractProvider';
import { ExecuteDTO } from './ExecuteDTO';

export class ExecuteUseCase {
  constructor(public contractProvider: ContractProvider) {}

  async execute(data: ExecuteDTO) {
    const contract = await this.contractProvider.getContract(data.contract, data.address, data.providerIndex, data.privateKey);

    return contract.__sendTx(
      contract.getContract().methods[data.method](...data.args)
    );
  }
}
