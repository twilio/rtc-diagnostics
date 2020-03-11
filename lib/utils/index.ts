import { PromiseTimedOutError } from '../errors';

/**
 * @internalapi
 * Determine whether audio is silent or not by analyzing an array of volume values.
 * @param volumes An array of volume values to to analyze.
 * @returns Whether audio is silent or not.
 */
export function detectSilence(volumes: number[]): boolean {
  // TODO Come up with a better algorithm for deciding if the volume values
  // resulting in a success

  // Loops over every sample, checks to see if it was completely silent by
  // checking if the average of the amplitudes is 0, and returns whether or
  // not more than 50% of the samples were silent.
  return !(volumes && volumes.length > 3 &&
    (volumes.filter((v: number) => v > 0).length / volumes.length) > 0.5);
}

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
