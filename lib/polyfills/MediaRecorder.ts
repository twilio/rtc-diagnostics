import { UnsupportedError } from '../errors';

/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const MediaRecorderUnsupportedError: UnsupportedError =
  new UnsupportedError(
    'MediaRecorder is not supported by this browser.',
  );

/**
 * @interalapi
 * Simple polyfill for `MediaRecorder`.
 */
export const MediaRecorderPolyfill: typeof window.MediaRecorder | undefined =
  typeof window !== 'undefined'
    ? window.MediaRecorder
    : undefined;
