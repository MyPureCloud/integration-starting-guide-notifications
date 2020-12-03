import { retry } from '@lifeomic/attempt';
import { ApiClient } from 'purecloud-platform-client-v2';
import { getAccessToken } from '../middleware/authorization';

export interface RetryParameters {
  delay: number;
  factor: number;
  maxAttempts: number;
}

/*
  Decorator function that will allow us to apply retry logic on any remote calls
*/
export const serviceProxy = (retryParameters?: RetryParameters) => (
  target: Object,
  propertyKey: String,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;

  let targetRetryParams: RetryParameters;
  if (!retryParameters) {
    targetRetryParams = { delay: 60000, factor: 1, maxAttempts: 5 }
  }
  else {
    targetRetryParams = retryParameters;
  }

  descriptor.value = async function (...args: any) {
    try {
      const client = ApiClient.instance;
      client.setAccessToken(getAccessToken());

      const returnValue = await retry(async () => { return originalMethod.apply(this, args); }, targetRetryParams);

      client.setAccessToken("");

      return returnValue;
    } catch (err) {
      console.error(`Error while retrieving invoke service: ${propertyKey}`, err);
      throw err;
    }
  }

  return descriptor
}