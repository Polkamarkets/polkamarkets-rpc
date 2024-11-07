import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { EventsWorker } from '@workers/EventsWorker';

const queuesEnabled = !process.env.DISABLE_QUEUES && !!process.env.REDIS_URL;

let queuesPath, queuesRouter;

if (queuesEnabled) {
  const eventsQueue = EventsWorker.init();

  const serverAdapter = new ExpressAdapter();

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [
      new BullMQAdapter(eventsQueue)
    ],
    serverAdapter: serverAdapter,
  });

  queuesPath = '/admin/queues';

  serverAdapter.setBasePath(queuesPath);

  queuesRouter = serverAdapter.getRouter();
}

export { queuesPath, queuesRouter };
