import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { EventsWorker } from './workers/EventsWorker';

// initializing all queues
// TODO: improve this
const eventsQueue = EventsWorker.init();

const serverAdapter = new ExpressAdapter();

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(eventsQueue)],
  serverAdapter: serverAdapter,
});

const queuesPath = '/admin/queues';

serverAdapter.setBasePath(queuesPath);

const queuesRouter = serverAdapter.getRouter();

export { queuesPath, queuesRouter };
