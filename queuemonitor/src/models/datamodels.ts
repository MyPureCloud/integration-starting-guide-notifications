/*
   These are DTOs uses only to pass data back and forth from the data layer in the code.  We map this data over to a Service Model before it is returned back to the user.
*/

/*
  The queue class has a couple of helper methods to properly represent set objects in the JSON stored in Redis.  JSON does not have the concept of a SET object so we conver it back and forth from a set <-> array.
*/
export class Queue {
  constructor(public id: string, public name: string, public users?: Set<String>) { }

  public static fromJSON(json: string) {
    const queueJSON = JSON.parse(json);
    return new Queue(queueJSON.id, queueJSON.name, new Set(queueJSON.users))
  }

  public static toJSON(queue: Queue) {
    return JSON.stringify(queue, (key, value) => value instanceof Set ? [...value] : value)
  }
}

export class User {
  constructor(public id: string, public queueId: string, public name: string, public queues?: Set<string>) { }
}

export class RoutingStatus {
  constructor(public userId?: string, public status?: string, public startTime?: string) { }
}

export class UserPresence {
  constructor(public userId: string, public presenceId: string, public systemPresence: string) { }
}

export class UserStatus {
  constructor(public routingStatus: RoutingStatus, public userPresence: UserPresence) { }
}