import { EventsController } from './EventsController';
import { EventsUseCase } from './EventsUseCase';
import { eventsSchema } from './EventsSchema';

const eventsUseCase = new EventsUseCase();
const eventsController = new EventsController(eventsUseCase);

export { eventsUseCase, eventsController, eventsSchema };
