import { NotificationsApi, Models } from 'purecloud-platform-client-v2';
import { serviceProxy } from '../general/serviceproxy';

/*
  Notifcation proxy wrappers call used by the Aotifications API.
*/
export class NotificationsProxy {
  @serviceProxy()
  public async createChannel() {
    const apiInstance = new NotificationsApi();
    return await apiInstance.postNotificationsChannels();
  }

  @serviceProxy()
  public async subscribeToTopics(channelId: string, topics: Models.ChannelTopic[]) {
    const apiInstance = new NotificationsApi();
    return await apiInstance.postNotificationsChannelSubscriptions(channelId, topics);
  }
}