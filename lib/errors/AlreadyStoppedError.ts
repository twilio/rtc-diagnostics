import { InvalidStateError } from './InvalidStateError';

/**
 * @internalapi
 * Specific instance of a `InvalidStateError` that mostly occurs when a test
 * is stopped more than once.
 */
export class AlreadyStoppedError extends InvalidStateError {
  constructor() {
    super(
      'This test already has a defined end timestamp. ' +
      'Tests should not be run multiple times, instead start a new one.',
    );

    this.name = 'AlreadyStoppedError';
  }
}
