import { UnsupportedError } from '../errors';

/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const createObjectURLUnsupportedError: UnsupportedError =
  new UnsupportedError(
    'createObjectURL is not supported by this browser.',
  );

/**
 * @interalapi
 * Simple polyfill for `createObjectURL`.
 */
export const createObjectURLPolyfill: typeof window.URL.createObjectURL | undefined =
  typeof window !== 'undefined' && typeof window.URL !== 'undefined'
    ? window.URL.createObjectURL
    : undefined;
