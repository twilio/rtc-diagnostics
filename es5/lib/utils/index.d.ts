/**
 * @internalapi
 * Determine whether audio is silent or not by analyzing an array of volume values.
 * @param volumes An array of volume values to to analyze.
 * @returns Whether audio is silent or not.
 */
export declare function detectSilence(volumes: number[]): boolean;
/**
 * @internalapi
 * Reject a promise after a specified timeout
 * @param promiseOrArray The promise to timeout.
 * @param timeoutMs The amount of time after which to reject the promise.
 */
export declare function waitForPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T | void>;
