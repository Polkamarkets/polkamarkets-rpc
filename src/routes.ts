import { Router } from 'express';
import { callController, callSchema } from '@useCases/Call';
import { executeController, executeSchema } from '@useCases/Execute';
import { eventsController, eventsSchema } from '@useCases/Events';
import { validateObjectSchema, validateObjectBodySchema } from '@middlewares/Yup';

const router = Router();

router.get('/call', validateObjectSchema(callSchema), (request, response) => {
  return callController.handle(request, response);
});

router.post('/execute', validateObjectBodySchema(executeSchema), (request, response) => {
  return executeController.handle(request, response);
});

router.get(
  '/events',
  validateObjectSchema(eventsSchema),
  (request, response) => {
    return eventsController.handle(request, response);
  }
);

router.post(
  '/events',
  validateObjectSchema(eventsSchema),
  (request, response) => {
    return eventsController.handleWorker(request, response);
  }
);

export { router };
