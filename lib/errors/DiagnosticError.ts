import { ErrorName } from '../constants';

/**
 * @internalapi
 * Generic Diagnostic SDK error that provides a superclass for all other errors.
 */
export class DiagnosticError extends Error {
  /**
   * The associated `DOMError` that caused this `DiagnosticError`.
   */
  domError: DOMError | DOMException | undefined;
  /**
   * The name of the error.
   *
   * This overrides the typing of the `Error.name` superclass member from
   * `string` to the specific enumeration of error names.
   */
  name: ErrorName;
  /**
   * The timestamp of the occurrence of this error.
   */
  timestamp: number;

  /**
   * Immediately sets the timestamp and sets the name to `DiagnosticError`.
   * @param domError
   * @param message
   */
  constructor(domError?: DOMError | DOMException, message?: string) {
    super(message);
    this.timestamp = Date.now();
    this.domError = domError;

    Object.setPrototypeOf(this, DiagnosticError.prototype);

    this.name = ErrorName.DiagnosticError;
  }
}
