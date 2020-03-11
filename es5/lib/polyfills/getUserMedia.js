"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
exports.GetUserMediaUnsupportedError = new errors_1.UnsupportedError('The function `getUserMedia` is not supported.');
/**
 * @internalapi
 * This polyfill serves to rebind `getUserMedia` to the `navigator.mediaDevices`
 * scope.
 */
exports.getUserMediaPolyfill = typeof window !== 'undefined' &&
    window.navigator !== undefined &&
    window.navigator.mediaDevices !== undefined &&
    window.navigator.mediaDevices.getUserMedia !== undefined
    ? window.navigator.mediaDevices.getUserMedia.bind(window.navigator.mediaDevices)
    : undefined;
//# sourceMappingURL=getUserMedia.js.map