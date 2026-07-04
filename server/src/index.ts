import { createServer } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { setupSocket } from './socket/index.js';

const httpServer = createServer(app);

setupSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`NearBeat server running on http://localhost:${env.PORT}`);
});
