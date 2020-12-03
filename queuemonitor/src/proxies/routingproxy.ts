import { RoutingApi } from 'purecloud-platform-client-v2';
import { serviceProxy } from '../general/serviceproxy';
import { Queue, User } from '../models/datamodels'
import { Logger } from 'tslog';

const log = new Logger({ name: "routingproxy", minLevel: process.env.DEBUG_LEVEL as any });

/*
   Wrappers calls to the Routing API.
*/
export class RoutingProxy {

  /*
    Gets a single page of queue data
  */
  @serviceProxy()
  private async getQueue(pageNum: number) {
    const opts = {
      pagesize: 100,
      pageNumber: pageNum,
    }

    const routingInstance = new RoutingApi();
    try {
      return await routingInstance.getRoutingQueues(opts);
    } catch (e) {
      log.error(`Error while retrieving queues for page number ${pageNum}`, e);
      return null;
    }
  }

  /*
   Gets a single page of queue data
 */
  @serviceProxy()
  public async getQueueByLogicalName(queueName: string): Promise<Queue[]> {
    const opts = {
      name: queueName,
    }

    const routingInstance = new RoutingApi();
    try {
      const queues = await routingInstance.getRoutingQueues(opts);
      const results = queues.entities
        .flat(1)
        .filter((value) => value != null)
        .map((value) => { return new Queue(value.id, value.name) });
      return results;
    } catch (e) {
      log.error(`Error while retrieving queues by name ${queueName}`, e);
      return null;
    }
  }


  /*
     Retrieves all of the queues in an organization
  */
  public async getQueues(): Promise<Queue[]> {
    let queues = [];
    let i = 1;
    let pageCount = 0;

    do {
      const queue = await this.getQueue(1);

      if (queue != null) {
        pageCount = queue.pageCount;

        queues.push(queue.entities);
      }

      i++;
    } while (i <= pageCount);

    const results = queues
      .flat(1)
      .filter((value) => value != null)
      .map((value) => { return new Queue(value.id, value.name) });

    return results;
  }

  /*
    Gets a single page of queue users.
  */
  @serviceProxy()
  private async getUsersForQueuePage(queueId: string, pageNum: number) {
    const opts = {
      pagesize: 100,
      pageNumber: pageNum,
    }

    const routingInstance = new RoutingApi();
    try {
      return await routingInstance.getRoutingQueueUsers(queueId, opts)
    } catch (e) {
      log.error(`Error while retrieving users for queue ${queueId}. page number ${pageNum} and `, e);
      return null;
    }
  }

  /*
      Gets all of the users associated with a queue
  */
  public async getUsersForQueue(queueId: string): Promise<User[]> {
    let users = [];
    let i = 1;
    let pageCount = 0;

    do {
      const usersForQueue = await this.getUsersForQueuePage(queueId, 1);

      if (usersForQueue != null) {
        pageCount = usersForQueue.pageCount;

        users.push(usersForQueue.entities);
      }

      i++;
    } while (i <= pageCount);

    const results = users
      .flat(1)
      .filter((value) => value != null)
      .map((value) => { return new User(value.id, queueId, value.name, new Set("")) });

    return results;
  }
}