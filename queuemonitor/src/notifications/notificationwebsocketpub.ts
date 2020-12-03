import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as http from 'http';
import { Logger } from 'tslog';

let webSocketQueuePublisher: WebSocketQueuePublisher;
const log: Logger = new Logger({ name: "notificationwebsocketpub", minLevel: process.env.DEBUG_LEVEL as any });

/*
   The WebSocketQueuePublisher is an event emitter.  When the queuemonitor first starts up it will expose a websocket 
   that can be used to send and retrieve traffic to the server.  We ignore sent messages, but when a client connects
   we establish a event "sink" and listen to any queuechange events that get passed to it.  

   We want this class to be treated as a singleton, so I have made the class non-exported and provided a set of helper functions
   to initialize the singleton instance and send messages to it.
*/
class WebSocketQueuePublisher extends EventEmitter {
  private wss: WebSocket.Server;

  constructor(server: http.Server) {
    super();
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.on('queuechange', (queue) => {
        //send immediatly a feedback to the incoming connection    
        ws.send(queue);
      });
    });

  }
}

/*
  Initializes the singleton WebSocketQueuePublisher
*/
export function initWebSocketQueuePublisher(server: http.Server) {
  if (webSocketQueuePublisher === undefined || webSocketQueuePublisher === null) {
    webSocketQueuePublisher = new WebSocketQueuePublisher(server);
  }
}

/*
  Sends a message to the queue
*/
export function sendQueueChangeMessage(message: any) {
  log.debug(`Sending Message: ${JSON.stringify(message, null, 4)}`);
  webSocketQueuePublisher.emit('queuechange', JSON.stringify(message, null, 4));
}
