
import { NotificationsApi } from 'purecloud-platform-client-v2';
import { NotificationChannelManager } from '../../notifications/notificationchannelmanager';

const Server = require('mock-socket').Server;
import WebSocket from 'ws';


jest.mock('purecloud-platform-client-v2');
const mockNotificationsApi = <jest.Mock<NotificationsApi>>NotificationsApi;

//Mocking out the service prox
jest.mock('../../general/serviceproxy');

const buildNotificationsSubscribeMock = () => {
  return {
    connectUri: "ws://localhost:9898",
    id: "channel-1234",
    expires: "12300"
  };
};

beforeEach(async () => {
  // Clear all instances and calls to constructor and all methods:
  mockNotificationsApi.mockClear();

});

describe('When the NotificationChannelManager is used:', () => {
  test('When a call to getInstance() is made, it should always return a singleton for the NotificationChannelManager()', async () => {
    const mockImpl = {
      postNotificationsChannels: (opts: any): any => {
        return new Promise((resolve, reject) => {
          resolve(buildNotificationsSubscribeMock());
        });
      },
    } as NotificationsApi;

    mockNotificationsApi.mockImplementation(() => {
      return mockImpl;
    });

    const mockServer = new Server("ws://localhost:9898");
    await new Promise(res => setTimeout(res, 2000));
    const connection = new WebSocket("ws://localhost:9898");
    await new Promise(res => setTimeout(res, 2000));
    connection.send('hello world');

    connection.onmessage = (event: any) => {
      console.log(`event: ${JSON.stringify(event.data, null, 4)}`); (event.data);
    };
  });
});  
