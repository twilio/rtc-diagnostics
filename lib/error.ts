export class DiagnosticError {
  timestamp: number;
  error: DOMError | undefined;
  message: string;

  constructor(error: DOMError | undefined = undefined, message: string = '') {
    this.timestamp = Date.now();
    this.error = error;
    this.message = message;
  }
}
