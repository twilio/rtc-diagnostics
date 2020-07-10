import { ErrorName } from '../constants';

/**
 * @internalapi
 * Error that is thrown by the utility `waitForPromise`.
 */
export class PromiseTimedOutError extends Error {
  /**
   * Name of this error.
   */
  name = ErrorName.PromiseTimedOutError;

  constructor() {
    super();
    Object.setPrototypeOf(this, PromiseTimedOutError.prototype);
  }
}
