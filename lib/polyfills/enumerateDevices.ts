import { UnsupportedError } from '../errors';

/**
 * Common error message for when `enumerateDevices` is not supported.
 */
export const enumerateDevicesUnsupportedMessage: string =
  'The function `enumerateDevices` is not supported.';

/**
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const EnumerateDevicesUnsupportedError: UnsupportedError =
  new UnsupportedError(enumerateDevicesUnsupportedMessage);

/**
 * Provide a polyfill for `navigator.mediaDevices.enumerateDevices` so that we
 * will not encounter a fatal-error upon trying to use it.
 */
export const enumerateDevicesPolyfill: typeof navigator.mediaDevices.enumerateDevices | undefined =
  typeof navigator !== 'undefined' &&
  navigator.mediaDevices &&
  navigator.mediaDevices.enumerateDevices
    ? navigator.mediaDevices.enumerateDevices
    : undefined;
