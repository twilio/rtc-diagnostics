"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
exports.AudioUnsupportedError = new errors_1.UnsupportedError('The `HTMLAudioElement` constructor `Audio` is not supported.');
/**
 * @internalapi
 * This polyfill serves as a clean way to detect if the `HTMLAudioElement`
 * constructor `Audio` does not exist.
 */
exports.AudioPolyfill = typeof window !== 'undefined'
    ? window.Audio
    : undefined;
//# sourceMappingURL=Audio.js.map