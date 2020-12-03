import { UserDB } from '../db/users';  
import { QueueDB } from '../db/queues';
import { NotificationChannelManager } from './notificationchannelmanager'
import { SimpleTopic } from '../models/topics'
import { UserStatus } from '../models/datamodels'
import { sendQueueChangeMessage } from './notificationwebsocketpub'
import { QueueService } from '../services/queueservice';
import { Logger } from 'tslog';

const log = new Logger({ name: "handlers", minLevel: process.env.DEBUG_LEVEL as any });
//TODO  Send a different message based on if its a queue activity or a user change.  

/*
   The handleUserStatusChange functions is invoked anytime a new user activity notification is received.  It will 
   retrieve the target record out of the redis cache, update it and then send queue notification messages for each queue that the user is a part of.
*/
async function handleUserStatusChange(topicName: string, message: any) {
  log.debug(`Received new routing status handler: ${JSON.stringify(message, null, 4)}`);
  const userDB = new UserDB();
  const queueService = new QueueService();

  const userStatus = await userDB.getUserStatus(message.id) as UserStatus
  const user = await userDB.getUser(message.id)
  userStatus.userPresence.presenceId = message.presence.presenceDefinition.id;
  userStatus.userPresence.systemPresence = message.presence.presenceDefinition.systemPresence;
  userStatus.routingStatus.status = message.routingStatus.status;
  userStatus.routingStatus.startTime = message.routingStatus.startTime;

  await userDB.setUserStatus(userStatus);

  //Send a message for each queue that is going be sent
  user.queues.forEach(async (queueId) => {
    const queue = await queueService.retrieveQueueById(queueId);
    sendQueueChangeMessage(queue);
  });
}

/*
  The handleQueueObservationChanges function processes and changes related to queue observation messages.  If a queue observation notification is received, the
  stats for the queue will be updated and then a new queue message will be published. 
*/
async function handleQueueObservationsChange(topicName: string, message: any) {
  log.debug(`Received new queue observations handler ${JSON.stringify(message, null, 4)}`);
  const queueDB = new QueueDB();
  const queueService = new QueueService();

  const queueStats = await queueDB.getQueueStatsById(message.group.queueId);

  queueStats.results.forEach((queueStat: any) => {
    const QUEUE_MEDIA_TYPE_MATCH = (queueStat.group.queueId === message.group.queueId && queueStat.group.mediaType === message.group.mediaType);
    const QUEUE_DATA_MATCH = (queueStat.group.queueId === message.group.queueId && queueStat.group.mediaType === undefined && message.group.mediaType === undefined);

    if (QUEUE_MEDIA_TYPE_MATCH || QUEUE_DATA_MATCH) {
      queueStat.data = message.data;
    }
  });

  await queueDB.setQueueStats(message.group.queueId, queueStats);
  const queueInfo = await queueService.retrieveQueueById(message.group.queueId);
  sendQueueChangeMessage(queueInfo);
}

export async function registerQueue(queueId: string) {
  const topicName = `v2.analytics.queues.${queueId}.observations`;
  log.info(`Registering queues topic: ${JSON.stringify(topicName, null, 4)}`);
  const simpleTopic = new SimpleTopic(topicName, handleQueueObservationsChange);

  const ncm = await NotificationChannelManager.getInstance();
  ncm.registerTopics([simpleTopic]);
}

export async function registerUser(userId: string) {
  const topicName = `v2.users.${userId}.activity`;
  log.info(`Registering user topic: ${JSON.stringify(topicName, null, 4)}`);
  const simpleTopic = new SimpleTopic(topicName, handleUserStatusChange);

  const ncm = await NotificationChannelManager.getInstance();
  ncm.registerTopics([simpleTopic]);
}
