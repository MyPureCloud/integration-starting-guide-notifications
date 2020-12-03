import { QueueDB } from "../db/queues";
import { RoutingProxy } from "../proxies/routingproxy";
import { AnalyticsProxy } from "../proxies/analyticsproxy";
import { UserProxy } from "../proxies/userproxy";
import * as datamodels from "../models/datamodels";
import * as servicemodels from "../models/servicemodels";
import { UserDB } from "../db/users";
import { Queue } from "../models/servicemodels";
import { Logger } from 'tslog';
import { registerQueue, registerUser } from "../notifications/handlers";

const log = new Logger({ name: "queueservice", minLevel: process.env.DEBUG_LEVEL as any });

/*
  The QueueService acts as a service layer to handle business logic calls.  
*/
export class QueueService {
  private routingProxy = new RoutingProxy();
  private userProxy = new UserProxy();
  private analyticsProxy = new AnalyticsProxy();
  private queueDB = new QueueDB();
  private userDB = new UserDB();


  /*
    Walks through the list of user ids passed in.  If we can find the user in the cache we are good, otherwise we retrieve the user using the User API.
  */
  private async populateUser(users: datamodels.User[]) {
    await Promise.all(users.map(async (user) => {
      const userInDB = await this.userDB.getUser(user.id)

      if (userInDB === null) {
        user.queues === null ? user.queues = new Set(user.queueId) : user.queues.add(user.queueId);
        await this.userDB.setUser(user);
      } else {
        userInDB.queues === null ? userInDB.queues = new Set(user.queueId) : userInDB.queues.add(user.queueId);
        await this.userDB.setUser(userInDB);
      }
    }));
  }

  /*
    Walks through the list of user ids passed in.  If we can find the userstatus in the cache we are good, otherwise we retrieve the user using the User API.
  */
  private async populateUserStatus(users: datamodels.User[]) {
    await Promise.all(users.map(async (user) => {
      const userStatusInDB = await this.userDB.getUserStatus(user.id);

      if (userStatusInDB === null) {
        const userStatus = await this.userProxy.getUserStatus(user.id);
        await this.userDB.setUserStatus(userStatus);
      }
    }));
  }

  /*
     Retrieves the queues from Redis or the Analytics API.
  */
  private async populateQueueStatistics(queueId: string) {
    const stats = await this.queueDB.getQueueStatsById(queueId);

    if (stats === null || stats === undefined) {
      const stats = await this.analyticsProxy.getObservationsForQueue(queueId);
      await this.queueDB.setQueueStats(queueId, stats);
    }
  }


  /*
   Retrieves all the users in the org and then retrieves all of the users for the queue.  Once we have that info, we populate the individual details
*/
  private async populateQueueByLogicalName(logicalName: string) {
    log.debug(`Retrieving queue from API by logical name ${logicalName}`);
    const queues = await this.routingProxy.getQueueByLogicalName(logicalName);
    log.debug(`Queue retrieved ${JSON.stringify(queues, null, 4)}`);

    await Promise.all(queues.map(async (queue) => {
      const usersForQueue = await this.routingProxy.getUsersForQueue(queue.id);
      const userIds = usersForQueue.map((user) => {
        return user.id;
      });

      queue.users = new Set(userIds);

      await this.queueDB.setQueue(queue);
      await this.populateUser(usersForQueue);
      await this.populateUserStatus(usersForQueue);
      await this.populateQueueStatistics(queue.id);
    }));
  }

  public async retrieveQueueDetail(queuesDM: datamodels.Queue[]) {
    //Map through all of the queue data objects and lookup their component pieces
    const queuesSM = await queuesDM.map(async (queueDM) => {
      const users = Array.from(queueDM.users).map(async (userId: string) => {
        const userStatusDM = await this.userDB.getUserStatus(userId);

        const userStatusSM = new servicemodels.UserStatus(userStatusDM.routingStatus as servicemodels.RoutingStatus, userStatusDM.userPresence);
        const userDM = await this.userDB.getUser(userId);
        return new servicemodels.User(userDM.id, userDM.name, userStatusSM);
      });

      //Wait for all the user lookups to complete
      const usersSM = await Promise.all(users);
      const queueStats = await this.queueDB.getQueueStatsById(queueDM.id);

      return new Queue(queueDM.id, queueDM.name, usersSM, queueStats);
    });

    return await Promise.all(queuesSM);
  }

  /*
     Reads all of the Queue objects (and their corresponding children) out of Redis.
  */
  public async retrieveAllQueues() {
    const queuesDM = await this.queueDB.getAllQueues();
    return await this.retrieveQueueDetail(queuesDM);
  }

  /*
     Retrieve a specific queue by its human readable name.
  */
  public async retrieveQueueByName(name: string) {
    let queueDM = await this.queueDB.getQueueByName(name);

    if ((queueDM === undefined) || (queueDM === null)) {
      log.info(`Queue could not be located in the cache: ${name}`);
      await this.populateQueueByLogicalName(name);
      queueDM = await this.queueDB.getQueueByName(name);

      //Registers a notification handler for the queue
      const queueDetails = await this.retrieveQueueDetail(new Array(queueDM));
      await registerQueue(queueDetails[0].id);

      //Registers notification handler for each user associated with thequeue.
      queueDetails[0].users.forEach(async (user) => {
        await registerUser(user.id);
      });

      return queueDetails;
    } else {
      return await this.retrieveQueueDetail(new Array(queueDM));
    }
  }

  /* 
     Retrieves a queue from Redis by its ID.
  */
  public async retrieveQueueById(queueId: string) {
    const queueDM = new Array(await this.queueDB.getQueueById(queueId));
    return await this.retrieveQueueDetail(queueDM);
  }

  /* 
     Returns all of the queue ids in Redis
  */
  public async getAllQueueIds() {
    return await this.queueDB.getAllQueueIds();
  }

  /*
     Returns all of the user ids in Redis.
  */
  public async getAllUserIds() {
    return await this.userDB.getAllUserIds();
  }
}

