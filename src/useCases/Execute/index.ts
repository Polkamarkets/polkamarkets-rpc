import { ExecuteController } from './ExecuteController';
import { ExecuteUseCase } from './ExecuteUseCase';
import { executeSchema } from './ExecuteSchema';

const executeUseCase = new ExecuteUseCase();
const executeController = new ExecuteController(executeUseCase);

export { executeUseCase, executeController, executeSchema };
