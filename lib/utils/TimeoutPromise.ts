import { PromiseTimedOutError } from '../errors';

/**
 * @internalapi
 * Reject a promise after a specified timeout
 * @param promiseOrArray The promise to timeout.
 * @param timeoutMs The amount of time after which to reject the promise.
 */
export function waitForPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | void> {
  let timer: NodeJS.Timeout;

  const timeoutPromise: Promise<void> = new Promise(
    (_: () => void, reject: (error: PromiseTimedOutError) => void) => {
      timer = setTimeout(() => reject(new PromiseTimedOutError()), timeoutMs);
    },
  );

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timer);
  });
}
