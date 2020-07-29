import { DiagnosticError } from './DiagnosticError';
/**
 * @internalapi
 * Error for when a browser-provided feature isn't available, such as
 * `getUserMedia`.
 */
export declare class UnsupportedError extends DiagnosticError {
    constructor(message: string);
}
