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

/**
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const AudioContextUnsupportedError = new UnsupportedError(
  'AudioContext is not supported by this browser.',
);

/**
 * Attempts to polyfill `AudioContext`.
 */
export const AudioContextPolyfill: typeof window.AudioContext | undefined =
  typeof window !== 'undefined'
    ? window.AudioContext || window.webkitAudioContext
    : undefined;
