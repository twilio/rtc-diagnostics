import { UnsupportedError } from '../errors';

/**
 * We need to redeclare `Audio` on `Window` for old Typescript versions.
 */
declare global {
  interface Window {
    Audio: typeof Audio;
  }
}

/**
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const GetUserMediaUnsupportedError = new UnsupportedError(
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
