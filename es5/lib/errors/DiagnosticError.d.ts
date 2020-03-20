/**
 * @internalapi
 * Generic Diagnostic SDK error that provides a superclass for all other errors.
 */
export declare class DiagnosticError extends Error {
    /**
     * The associated `DOMError` that caused this `DiagnosticError`.
     */
    domError: DOMError | DOMException | undefined;
    /**
     * The timestamp of the occurrence of this error.
     */
    timestamp: number;
    /**
     * Immediately sets the timestamp and sets the name to `DiagnosticError`.
     * @param domError
     * @param message
     */
    constructor(domError?: DOMError | DOMException, message?: string);
}
