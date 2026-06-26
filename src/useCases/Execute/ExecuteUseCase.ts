import { ContractProvider } from '@providers/ContractProvider';
import { ExecuteDTO } from './ExecuteDTO';

export class ExecuteUseCase {
  async execute(contractProvider: ContractProvider, data: ExecuteDTO) {
    const contract = await contractProvider.getContract(data.contract, data.address, data.providerIndex, data.privateKey);

    return contract.__sendTx(
      contract.getContract().methods[data.method](...data.args)
    );
  }
}
