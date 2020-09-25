import { DiagnosticError } from './DiagnosticError';
/**
 * @internalapi
 * Error that is thrown when there are invalid options passed to a test.
 */
export declare class InvalidOptionsError<T extends Record<string, any>> extends DiagnosticError {
    reasons: Partial<Record<keyof T, string[]>>;
    constructor(reasons: Partial<Record<keyof T, string[]>>);
}
