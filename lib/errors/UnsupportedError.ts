import { DiagnosticError } from './DiagnosticError';

export class UnsupportedError extends DiagnosticError {
  constructor(message: string) {
    super(undefined, message);

    this.name = 'UnsupportedError';
  }
}
