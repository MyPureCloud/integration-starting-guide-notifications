import { Queue } from "../models/datamodels";
import { TedisPool } from "tedis";
import { serviceProxy } from '../general/serviceproxy';
import { Logger, LoggerWithoutCallSite } from 'tslog';


const log = new Logger({ name: "oauthcontroller", minLevel: process.env.DEBUG_LEVEL as any });

//switch over to using a client
const pool = new TedisPool({
  port: 6379,
  host: "redis",
  min_conn: 50,
  max_conn: 200
});

/*
   The QueueDB class manages the retrieval and saving of all Redis records related to queues.  It managers the following keys:

   queue-record-id-{queue-id} - Queue record saved by queue id
   queue-record-name-{queue name} - Queue record save by queue name
   queue-stats-{queue-id} - Queue statistics saved by queue id 
*/
export class QueueDB {
  public async getQueueById(queueId: string) {
    const tedis = await pool.getTedis()
    const key = queueId.includes('queue-record-id-') ? queueId : `queue-record-id-${queueId}`

    const results = await tedis.get(key)
    pool.putTedis(tedis);

    const queueJSON = JSON.parse(results as string)
    queueJSON.users = new Set(queueJSON.users);
    return queueJSON
  }

  public async getQueueByName(queueName: string) {
    const tedis = await pool.getTedis()
    const key = queueName.includes('queue-record-name-') ? queueName : `queue-record-name-${queueName}`

    const results = await tedis.get(key)
    pool.putTedis(tedis);

    if ((results === undefined) || (results === null)) {
      return null;
    } else {
      const queueJSON = JSON.parse(results as string);
      queueJSON.users = new Set(queueJSON.users);
      return queueJSON;
    }
  }

  public async setQueue(queue: Queue) {
    const tedis = await pool.getTedis();
    const keyId = `queue-record-id-${queue.id}`;
    const keyName = `queue-record-name-${queue.name}`;  //Save the same record by queue name
    await tedis.set(keyId, Queue.toJSON(queue));
    await tedis.set(keyName, Queue.toJSON(queue));
    pool.putTedis(tedis);
  }

  public async getQueueStatsById(queueId: string) {
    const tedis = await pool.getTedis();
    const key = queueId.includes('queue-stats-') ? queueId : `queue-stats-${queueId}`;

    const results = await tedis.get(key);
    pool.putTedis(tedis);

    return JSON.parse(results as string);
  }

  public async setQueueStats(queueId: string, stats: any) {
    const tedis = await pool.getTedis();
    const keyId = `queue-stats-${queueId}`;

    await tedis.set(keyId, Queue.toJSON(stats));
    pool.putTedis(tedis);
  }

  public async getAllQueues() {
    const tedis = await pool.getTedis();
    const keyPattern = `queue-record-id-*`;

    const keys = await tedis.keys(keyPattern);

    const queueJson = await tedis.mget(keys.pop(), ...keys);
    const queues = queueJson.map((queue: string) => { return Queue.fromJSON(queue); });
    pool.putTedis(tedis);
    return queues;
  }

  public async getAllQueueIds() {
    const tedis = await pool.getTedis();
    const keyPattern = `queue-record-id-*`;

    const keys = await tedis.keys(keyPattern);
    const queues = keys.map((queueKey: string) => { return queueKey.replace("queue-record-id-", ""); });
    pool.putTedis(tedis);
    return queues;
  }
}
