import { DiagnosticError } from './DiagnosticError';

/**
 * Error that is thrown when there are invalid options passed to a test.
 */
export class InvalidOptionsError<
  T extends Record<string, any>
> extends DiagnosticError {
  // Because each option could have had a DOMError or DOMException, we look at
  // that here.
  reasons: Partial<Record<keyof T, DiagnosticError>> = {};

  constructor(reasons: Partial<Record<keyof T, DiagnosticError>>) {
    super(undefined, 'Some of the options passed to this test were invalid.');

    this.reasons = reasons;
    this.name = 'InvalidOptionsError';
  }
}
