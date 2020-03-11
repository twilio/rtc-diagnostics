import { UnsupportedError } from '../errors';

/**
 * @internalapi
 * We need to redeclare `Audio` on `Window` for old Typescript versions.
 */
declare global {
  interface Window {
    Audio: typeof Audio;
  }
}

/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const AudioUnsupportedError: UnsupportedError =
  new UnsupportedError(
    'The `HTMLAudioElement` constructor `Audio` is not supported.',
  );

/**
 * @internalapi
 * This polyfill serves as a clean way to detect if the `HTMLAudioElement`
 * constructor `Audio` does not exist.
 */
export const AudioPolyfill: typeof Audio | undefined =
  typeof window !== 'undefined'
    ? window.Audio
    : undefined;
