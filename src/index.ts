import 'dotenv/config';
import { app } from './app';

// Global process-level error handlers to avoid hard crashes
process.on('unhandledRejection', (reason: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
});

app.listen(process.env.PORT || 3333);
