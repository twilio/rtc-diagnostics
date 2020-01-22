import { UnsupportedError } from '../errors';

/**
 * This polyfill serves as a clean way to throw an error if the `HTMLAudioElement`
 * constructor `Audio` does not exist.
 */
export const polyfillAudio: () => typeof window.Audio = () => {
  if (
    typeof window === 'undefined' ||
    window.Audio === undefined
  ) {
    // Fatal error
    throw new UnsupportedError(
      'The `HTMLAudioElement` constructor `Audio` is not supported.',
    );
  }

  return window.Audio;
};
