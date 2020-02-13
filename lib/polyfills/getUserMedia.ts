import { UnsupportedError } from '../errors';

/**
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const GetUserMediaUnsupportedError: UnsupportedError =
  new UnsupportedError(
    'The function `getUserMedia` is not supported.',
  );

/**
 * This polyfill serves to rebind `getUserMedia` to the `navigator.mediaDevices`
 * scope.
 */
export const getUserMediaPolyfill: typeof window.navigator.mediaDevices.getUserMedia | undefined =
  typeof window !== 'undefined' &&
  window.navigator !== undefined &&
  window.navigator.mediaDevices !== undefined &&
  window.navigator.mediaDevices.getUserMedia !== undefined
    ? window.navigator.mediaDevices.getUserMedia.bind(
      window.navigator.mediaDevices,
    )
    : undefined;
