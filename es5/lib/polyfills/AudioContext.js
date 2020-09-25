"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
exports.AudioContextUnsupportedError = new errors_1.UnsupportedError('AudioContext is not supported by this browser.');
/**
 * @internalapi
 * Attempts to polyfill `AudioContext`.
 */
exports.AudioContextPolyfill = typeof window !== 'undefined'
    ? window.AudioContext || window.webkitAudioContext
    : undefined;
//# sourceMappingURL=AudioContext.js.map