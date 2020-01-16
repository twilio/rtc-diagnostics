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

export const PolyfillAudioContext: typeof AudioContext | null =
  typeof window !== 'undefined'
    ? window.AudioContext || window.webkitAudioContext || null
    : null;
