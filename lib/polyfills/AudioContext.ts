import { UnsupportedError } from '../errors';

/**
 * This file provides a cross-browser polyfill for AudioContext.
 *
 * Currently, Safari is the only browser that needs this as it still prefixes
 * `AudioContext` as `webkitAudioContext`.
 *
 * It is necessary to declare `AudioContext` in the `Window` global as it does
 * not exist in older typings.
 */

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

const UnsupportedAudioContextError = new UnsupportedError(
  'AudioContext is not supported by this browser.',
);

/**
 * Attempts to polyfill `AudioContext`. Will throw an `UnsupportedError` if
 * unable to.
 */
export const polyfillAudioContext: () => typeof AudioContext = () => {
  if (typeof window === 'undefined') {
    // Fatal error
    throw UnsupportedAudioContextError;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (AudioContext === undefined) {
    throw UnsupportedAudioContextError;
  }

  return AudioContext;
};
