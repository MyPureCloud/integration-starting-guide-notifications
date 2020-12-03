import { serviceProxy } from '../general/serviceproxy';
import { AnalyticsApi, Models } from 'purecloud-platform-client-v2';

/*
  The analytics proxy class wrappers calls out to Analytics API. Specifically, I am wrappering the call to get
  Queue Observations.
*/


export class AnalyticsProxy {
  private buildObservationQueryParams(queueId: String) {
    return {
      "filter": {
        "type": "or",
        "predicates": [
          {
            "type": "dimension",
            "dimension": "queueId",
            "operator": "matches",
            "value": queueId
          }
        ]
      },
      "metrics": [
        "oOnQueueUsers",
        "oUserPresences",
        "oUserRoutingStatuses",
        "oWaiting",
        "oMemberUsers",
        "oInteracting",
        "oOffQueueUsers",
        "oActiveUsers"
      ]
    } as Models.QueueObservationQuery
  }

  @serviceProxy()
  public async getObservationsForQueue(queueId: string) {
    let users = [];
    let i = 1;
    let pageCount = 0;

    const analyticsInstance = new AnalyticsApi();
    try {
      const queryParams = this.buildObservationQueryParams(queueId);
      const results = await analyticsInstance.postAnalyticsQueuesObservationsQuery(queryParams);
      return results;
    }
    catch (e) {
      console.error(`Error while retrieving observations data for ${queueId}`, e);
      return null;
    }

  }
}  