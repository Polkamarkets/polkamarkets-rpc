import { PolkamarketsContractProvider } from '@providers/implementations/PolkamarketsContractProvider';
import { ExecuteController } from './ExecuteController';
import { ExecuteUseCase } from './ExecuteUseCase';
import { executeSchema } from './ExecuteSchema';

const polkamarketsContractProvider = new PolkamarketsContractProvider();

const executeUseCase = new ExecuteUseCase(polkamarketsContractProvider);
const executeController = new ExecuteController(executeUseCase);

export { executeUseCase, executeController, executeSchema };
