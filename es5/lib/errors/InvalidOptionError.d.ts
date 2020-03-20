import { DiagnosticError } from './DiagnosticError';
/**
 * @internalapi
 */
export declare class InvalidOptionError extends DiagnosticError {
    error: DiagnosticError | DOMError | DOMException | undefined;
    option: string;
    reason: string;
    constructor(option: string, reason: string, error?: DiagnosticError | DOMError | DOMException);
}
