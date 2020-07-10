import { ErrorName } from '../constants';
import { DiagnosticError } from './DiagnosticError';

/**
 * @internalapi
 * Error that can be thrown when a single option passed to a test is invalid.
 */
export class InvalidOptionError extends DiagnosticError {
  error: DiagnosticError | DOMError | DOMException | undefined;
  option: string;
  reason: string;

  constructor(
    option: string,
    reason: string,
    error?: DiagnosticError | DOMError | DOMException,
  ) {
    const domError: DOMError | DOMException | undefined =
      (typeof DOMError !== 'undefined' && error instanceof DOMError) ||
      (typeof DOMException !== 'undefined' && error instanceof DOMException)
        ? error
        : undefined;

    super(
      domError,
      `Option "${option}" invalid with reason: "${reason}".`,
    );

    this.option = option;
    this.reason = reason;
    this.error = error;

    this.name = ErrorName.InvalidOptionError;
  }
}
