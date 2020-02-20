import { PromiseTimedOutError } from '../errors';

/**
 * Reject a promise after a specified timeout
 * @param promiseOrArray The promise to timeout.
 * @param timeoutMs The amount of time after which to reject the promise.
 */
export function waitForPromise<T>(
  promiseOrArray: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: NodeJS.Timeout;

  const promise: Promise<any> =
    Array.isArray(promiseOrArray)
      ? Promise.all(promiseOrArray)
      : promiseOrArray;

  const timeoutPromise: Promise<void> = new Promise(
    (_: () => void, reject: (error: PromiseTimedOutError) => void) => {
      timer = setTimeout(() => reject(new PromiseTimedOutError()), timeoutMs);
    },
  );

  return Promise.race([
    promise,
    timeoutPromise,
  ]).then((result: T) => {
    clearTimeout(timer);
    return result;
  });
}
