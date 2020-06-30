/**
 * Basic "warning" class. Contains a message and a type. Can be emitted by tests
 * when necessary.
 */
export class DiagnosticWarning {
  /**
   * Message explaining the warning.
   */
  message: string;
  /**
   * When the warning was created.
   */
  timestamp: number;
  /**
   * Type of warning. For example, "low-audio-level".
   */
  type: string;

  /**
   * Constructor for the [[DiagnosticWarning]] class. Sets the type and message
   * of the object.
   * @param type
   * @param message
   */
  constructor(type: string, message: string) {
    this.message = message;
    this.timestamp = Date.now();
    this.type = type;
    Object.setPrototypeOf(this, DiagnosticWarning.prototype);
  }
}
