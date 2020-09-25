"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Common error message for when `enumerateDevices` is not supported.
 */
exports.enumerateDevicesUnsupportedMessage = 'The function `enumerateDevices` is not supported.';
/**
 * @internalapi
 * Common error that can be thrown when the polyfill is unable to work.
 */
exports.EnumerateDevicesUnsupportedError = new errors_1.UnsupportedError(exports.enumerateDevicesUnsupportedMessage);
/**
 * @internalapi
 * Provide a polyfill for `navigator.mediaDevices.enumerateDevices` so that we
 * will not encounter a fatal-error upon trying to use it.
 */
exports.enumerateDevicesPolyfill = typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    navigator.mediaDevices.enumerateDevices
    ? navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices)
    : undefined;
/**
 * @internalapi
 * Firefox does not have a device ID that is "default". To get that device ID,
 * we need to enumerate all the devices and grab the first of each "kind".
 */
function getDefaultDevices(devices) {
    var defaultDeviceIds = {};
    for (var _i = 0, _a = devices.reverse(); _i < _a.length; _i++) {
        var device = _a[_i];
        defaultDeviceIds[device.kind] = device;
    }
    return defaultDeviceIds;
}
exports.getDefaultDevices = getDefaultDevices;
//# sourceMappingURL=enumerateDevices.js.map