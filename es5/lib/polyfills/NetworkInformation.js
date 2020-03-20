"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internalapi
 */
var polyfillWindow = typeof window !== 'undefined'
    ? window
    : undefined;
/**
 * @internalapi
 */
exports.networkInformationPolyfill = typeof polyfillWindow !== 'undefined' && polyfillWindow.navigator &&
    polyfillWindow.navigator.connection
    ? polyfillWindow.navigator.connection
    : undefined;
//# sourceMappingURL=NetworkInformation.js.map