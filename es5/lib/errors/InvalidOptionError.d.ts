import { DiagnosticError } from './DiagnosticError';
/**
 * @internalapi
 * Error that can be thrown when a single option passed to a test is invalid.
 */
export declare class InvalidOptionError extends DiagnosticError {
    error: DiagnosticError | DOMError | DOMException | undefined;
    option: string;
    reason: string;
    constructor(option: string, reason: string, error?: DiagnosticError | DOMError | DOMException);
}
