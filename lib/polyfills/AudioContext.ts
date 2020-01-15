/**
 * This file provides a cross-browser polyfill for AudioContext.
 *
 * Currently, Safari is the only browser that needs this as it still prefixes
 * `AudioContext` as `webkitAudioContext`.
 */

declare global {
  interface Window {
    webkitAudioContext: typeof window.AudioContext;
  }
}

export const AudioContext: typeof window.AudioContext | null =
  typeof window !== 'undefined'
    ? window.AudioContext || window.webkitAudioContext || null
    : null;
