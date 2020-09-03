import { UnsupportedError } from '../errors';
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export declare const GetUserMediaUnsupportedError: UnsupportedError;
/**
 * @internalapi
 * This polyfill serves to rebind `getUserMedia` to the `navigator.mediaDevices`
 * scope.
 */
export declare const getUserMediaPolyfill: typeof window.navigator.mediaDevices.getUserMedia | undefined;
