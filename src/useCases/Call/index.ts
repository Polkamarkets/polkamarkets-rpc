import { CallController } from './CallController';
import { CallUseCase } from './CallUseCase';
import { callSchema } from './CallSchema';

const callUseCase = new CallUseCase();
const callController = new CallController(callUseCase);

export { callUseCase, callController, callSchema };
