import { QueueService } from '../services/queueservice';
import { Request, Response } from 'express';

export async function getAllQueues(req: Request, res: Response) {     //put the express types here
  const queueService = new QueueService();
  const queues = await queueService.retrieveAllQueues();

  res.statusCode = 200;
  res.send(queues);
}

export async function getQueueByName(req: Request, res: Response) {
  const queueService = new QueueService();
  const queues = await queueService.retrieveQueueByName(req.params.name)
  res.statusCode = 200;

  res.send(queues);
}