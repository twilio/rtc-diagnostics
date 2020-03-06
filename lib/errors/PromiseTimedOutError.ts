/**
 * @internalapi
 * Error that is thrown by the utility `waitForPromise`.
 */
export class PromiseTimedOutError extends Error {
  constructor() {
    super();
    Object.setPrototypeOf(this, PromiseTimedOutError.prototype);
  }
}
