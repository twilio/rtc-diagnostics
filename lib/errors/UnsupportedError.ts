import { DiagnosticError } from './DiagnosticError';

/**
 * @internalapi
 */
export class UnsupportedError extends DiagnosticError {
  constructor(message: string) {
    super(undefined, message);

    this.name = 'UnsupportedError';
  }
}
