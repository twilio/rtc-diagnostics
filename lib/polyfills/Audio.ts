import { UnsupportedError } from '../errors';

/**
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const AudioUnsupportedError = new UnsupportedError(
  'The `HTMLAudioElement` constructor `Audio` is not supported.',
);

/**
 * This polyfill serves as a clean way to detect if the `HTMLAudioElement`
 * constructor `Audio` does not exist.
 */
export const AudioPolyfill = typeof window !== 'undefined'
  ? window.Audio
  : undefined;
