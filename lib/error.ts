export class DiagnosticError {
  error: DOMError | undefined;
  message: string;
  timestamp: number;

  constructor(error?: DOMError, message: string = '') {
    this.timestamp = Date.now();
    this.error = error;
    this.message = message;
  }
}

export const AlreadyStoppedError = new DiagnosticError(
  undefined,
  'Test already stopped.',
);
