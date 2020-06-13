import { UnsupportedError } from '../errors';

/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
export const BlobUnsupportedError: UnsupportedError =
  new UnsupportedError(
    'Blob is not supported by this browser.',
  );

/**
 * @interalapi
 * Simple polyfill for `Blob`.
 */
export const BlobPolyfill: typeof window.Blob | undefined =
  typeof window !== 'undefined'
    ? window.Blob
    : undefined;
