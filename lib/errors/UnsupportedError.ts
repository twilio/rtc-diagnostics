import { ErrorName } from '../constants';
import { DiagnosticError } from './DiagnosticError';

/**
 * @internalapi
 * Error for when a browser-provided feature isn't available, such as
 * `getUserMedia`.
 */
export class UnsupportedError extends DiagnosticError {
  constructor(message: string) {
    super(undefined, message);

    this.name = ErrorName.UnsupportedError;
  }
}
