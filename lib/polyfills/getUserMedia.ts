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
 * This polyfill only serves to rebind `getUserMedia` to the
 * `navigator.mediaDevices` scope and throws an `UnsupportedError` if it does
 * not exist.
 */
export const polyfillGetUserMedia: () => typeof window.navigator.mediaDevices.getUserMedia = () => {
  if (
    typeof window === 'undefined' ||
    window.navigator === undefined ||
    window.navigator.mediaDevices === undefined ||
    window.navigator.mediaDevices.getUserMedia === undefined
  ) {
    throw new UnsupportedError(
      'The function `getUserMedia` is not supported.',
    );
  }

  // We need to bind `getUserMedia` here because of a browser bug that loses
  // the scope.
  return window.navigator.mediaDevices.getUserMedia.bind(
    window.navigator.mediaDevices,
  );
};
