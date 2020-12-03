import * as dotenv from 'dotenv';
import express from 'express';

import { getAllQueues, getQueueByName } from './controllers/queuecontroller';
import { callback } from './controllers/oauthcontroller';
import { initWebSocketQueuePublisher } from './notifications/notificationwebsocketpub';
import { authvalidation } from './middleware/authorization'
import { Logger } from 'tslog';
import * as http from 'http';

const log = new Logger({ name: "index", minLevel: process.env.DEBUG_LEVEL as any });

(async () => {
  dotenv.config();

  //Set up the web endpoints
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');
  const app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(authvalidation);
  app.use('/static', express.static('public'));
  app.get('/queues', getAllQueues);
  app.get('/queues/:name', getQueueByName);
  app.get('/oauth2/callback', callback);

  //Configure the web socket server 
  const server = http.createServer(app);
  initWebSocketQueuePublisher(server);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    log.info(`Queuemon listening at http://localhost:${port}`);
  });
})();