import { ContractProvider } from '@providers/ContractProvider';
import { CallDTO } from './CallDTO';

export class CallUseCase {
  async execute(contractProvider: ContractProvider, data: CallDTO) {
    const contract = contractProvider.getContract(data.contract, data.address, data.providerIndex);

    return contract.getContract().methods[data.method](...data.args).call();
  }
}
