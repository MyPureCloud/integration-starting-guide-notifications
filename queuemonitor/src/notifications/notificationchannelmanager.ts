import { NotificationsProxy } from '../proxies/notificationsapi';
import { NotificationsApi, Models } from 'purecloud-platform-client-v2';
import { Topic, SimpleTopic, CompoundTopic } from '../models/topics';
import { Logger } from 'tslog';
import WebSocket  from 'ws';

const log = new Logger({ name: "notificationchannelmanager", minLevel: process.env.DEBUG_LEVEL as any });

/**
 * The NotificationChannelManager creates a websocket returned by the notification manager.  It will then also register handlers for the
 * messages comming in off the Websocket.
 * 
 * For this implementation, I have implemented the NotificationChannelManager as a singleton.  However, there is no requirement that this class has to be a singleton
 * if you wanted to managed multiple websockets
 */
export class NotificationChannelManager {
  private static instance: NotificationChannelManager;
  private _channel: Models.Channel;
  private _topics: Models.ChannelTopic[] = new Array<Models.ChannelTopic>();                    //List of topic objects
  private _topicHandlers = new Map<string, SimpleTopic>();  //Map containing the topic id as the key and the handler that will process it.
  private socket: any;

  private constructor() { }

  public get channel() {
    return { ...this._channel };
  }

  public get topics() {
    return { ...this._topics };
  }

  public get topicHandlers() {
    return { ...this._topicHandlers };
  }

  /*
    Maps each topic to the topic handlers map.
  */
  private registerTopicHandlers(topics: Topic[]): void {
    /*Walk through each topic*/
    topics.forEach((topic) => {

      /*Simple topics get mapped right to the topic id*/
      if (topic instanceof SimpleTopic) {
        this._topicHandlers.set(topic.id, topic)
      }

      /*Compound topics get converted to simple topics and then assigned to the map*/
      if (topic instanceof CompoundTopic) {
        const simpleTopics = topic.getAsSimpleTopics();
        simpleTopics.forEach((simpleTopic) => {
          this._topicHandlers.set(simpleTopic.id, simpleTopic);
        });
      }
    });
  }

  /*
      The connect() method creates a channel in the notification service and then subscribes all of the topics that the user
      has listed to the websocket.  The connect() function also maps the event coming in off the web socket and then processes them.
  */
  private async connect(): Promise<void> {
    const notificationsProxy = new NotificationsProxy();
    this._channel = await notificationsProxy.createChannel();

    log.debug(`channel: ${JSON.stringify(this._channel, null, 4)}`);

    const url = this._channel.connectUri;
    console.log(`CHANNEL: ${JSON.stringify(this._channel, null, 4)}`);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      log.info(`Socket opened to ${this._channel.id}`);
    }

    //TODO Implement retry logic if the websocket encounters an error
    //TODO Implement reconnect logic if the websocket is closed by genesys cloud.
    this.socket.onerror = (error: any) => {
      log.error(`Error occurred on channel: ${this._channel.connectUri}`, error)
    }

    /*
      Everytime a message comes in, we attempt to lookup the topic for the handler and then execute it.
    */
    this.socket.onmessage = (socketData: any) => {
      const message = JSON.parse(socketData.data);

      if (this._topicHandlers.get(message.topicName) != null) {
        const topic = this._topicHandlers.get(message.topicName)
        topic.defaultHandler(message.topicName, message.eventBody);
      } else {

        /*If we can not find a handler, we just log an error*/
        if (message.topicName != "channel.metadata") {
          log.error(`Could not find handler for topic: ${message.topicName}`);
        }
      }
    }
  }

  /*
    The registerTopics will allow you to register topics that the user interested in.
  */
  public async registerTopics(topics: Topic[]) {
    log.debug("I am in register topics");

    const notificationsProxy = new NotificationsProxy();

    await Promise.all(topics.map(async (topic) => {
      /*Simple topics get mapped right to the topic id*/
      if (topic instanceof SimpleTopic) {
        if (!this._topicHandlers.get(topic.id)) {
          this.registerTopicHandlers(topics);
          this._topics.push(topic);
          this._topicHandlers.set(topic.id, topic);
          log.debug(`Subscribing topic ${topic.id} to channel ${this._channel.id}`);
          await notificationsProxy.subscribeToTopics(this._channel.id, [topic]);
        }
      }

      /*Compound topics get converted to simple topics and then assigned to the map*/
      if (topic instanceof CompoundTopic) {
        const simpleTopics = topic.getAsSimpleTopics();
        await Promise.all(simpleTopics.map(async (simpleTopic) => {
          if (!this._topicHandlers.get(simpleTopic.id)) {
            this.registerTopicHandlers(topics);
            this._topics.push(simpleTopic);
            this._topicHandlers.set(simpleTopic.id, simpleTopic);
            log.debug(`Subscribing topic ${topic.id} to channel ${this._channel.id}`);
            await notificationsProxy.subscribeToTopics(this._channel.id, [simpleTopic]);
          }
        }));
      }
    }));
  }

  public static async getInstance() {
    if (!NotificationChannelManager.instance) {

      log.debug("Initiating notification web socket connection with target topics...");

      this.instance = new NotificationChannelManager();
      this.instance.registerTopicHandlers([]);

      await this.instance.connect();
    }

    return this.instance;
  }
}