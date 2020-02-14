/**
 * Simple utility that wraps any promise in a race with another one that times
 * out after a certain amount of time.
 * @param promise the promise to place in a race against a timeout
 * @param timeout amount of time in milliseconds until the promise rejects
 * @param rejection what to reject the timeout promise with
 */
export function timeoutPromise<T>(
  promise: Promise<any>,
  timeout: number,
  rejection?: T,
): Promise<void> {
  return Promise.race([
    promise,
    new Promise(
      (_: (_: void) => void, reject: (rejection?: T) => void): void => {
        setTimeout(() => reject(rejection), timeout);
      },
    ),
  ]);
}
