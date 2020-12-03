import { UsersApi } from 'purecloud-platform-client-v2';
import { RoutingStatus } from '../models/servicemodels';
import { serviceProxy } from '../general/serviceproxy';
import { UserPresence, UserStatus } from '../models/servicemodels';


/*
   Wrappers calls to the User class.
*/
export class UserProxy {

  @serviceProxy()
  public async getUserStatus(userId: string) {

    const userInstance = new UsersApi();
    try {
      const opts = {
        expand: ["presence", "routingStatus"]
      }

      const user = await userInstance.getUser(userId, opts);
      const routingStatus = new RoutingStatus(user.id, user.routingStatus.status, user.routingStatus.startTime);
      const userPresence = new UserPresence(user.id, user.presence.presenceDefinition.id, user.presence.presenceDefinition.systemPresence)
      return new UserStatus(routingStatus, userPresence);
    } catch (e) {
      console.error(`Error while retrieving user ${userId}`, e);
      return null;
    }
  }
}  
