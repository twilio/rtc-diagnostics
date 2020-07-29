import { ErrorName } from '../constants';
/**
 * @internalapi
 * Error that is thrown by the utility `waitForPromise`.
 */
export declare class PromiseTimedOutError extends Error {
    /**
     * Name of this error.
     */
    name: ErrorName;
    constructor();
}
