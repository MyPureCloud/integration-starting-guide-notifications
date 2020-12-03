
/*
   The service models represent the data that is being passed back from the service layer.
*/

//TODO need to fix the queueStats property to be a well-defined type.  I used any just to get some work started but 
//to be type safe we should not use as any field.
export class Queue {
  constructor(public id: string, public name: string, public users?: User[], public queueStats?: any) { }
}

export class User {
  constructor(public id: string, public name: string, public status?: UserStatus, public queues?: Queue[]) { }
}

export class RoutingStatus {
  constructor(public userId: string, public status: string, public startTime: string) { }
}

export class UserPresence {
  constructor(public userId: string, public presenceId: string, public systemPresence: string) { }
}

export class UserStatus {
  constructor(public routingStatus: RoutingStatus, public userPresence: UserPresence) { }
}