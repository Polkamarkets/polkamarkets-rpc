import express from 'express';
import cors from 'cors';

import { router } from './routes';
import { queuesPath, queuesRouter } from './queues';

const app = express();

// uncomment for development purposes
// import logger from 'morgan';
// app.use(logger('dev'));

app.use(cors());
app.use(express.json());
app.use(router);
if (queuesRouter && queuesPath) {
  app.use(queuesPath, queuesRouter);
}

// Centralized error handler so requests return 500 instead of crashing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Express error handler:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

export { app };
