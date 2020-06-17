import { InvalidStateError } from './InvalidStateError';
/**
 * @internalapi
 * Specific instance of a `InvalidStateError` that mostly occurs when a test
 * is stopped more than once.
 */
export declare class AlreadyStoppedError extends InvalidStateError {
    constructor();
}
