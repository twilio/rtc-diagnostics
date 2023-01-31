"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var AudioInputTest_1 = require("./AudioInputTest");
exports.AudioInputTest = AudioInputTest_1.AudioInputTest;
exports.testAudioInputDevice = AudioInputTest_1.testAudioInputDevice;
var AudioOutputTest_1 = require("./AudioOutputTest");
exports.AudioOutputTest = AudioOutputTest_1.AudioOutputTest;
exports.testAudioOutputDevice = AudioOutputTest_1.testAudioOutputDevice;
var constants_1 = require("./constants");
exports.ErrorName = constants_1.ErrorName;
exports.WarningName = constants_1.WarningName;
var DiagnosticError_1 = require("./errors/DiagnosticError");
exports.DiagnosticError = DiagnosticError_1.DiagnosticError;
var MediaConnectionBitrateTest_1 = require("./MediaConnectionBitrateTest");
exports.MediaConnectionBitrateTest = MediaConnectionBitrateTest_1.MediaConnectionBitrateTest;
exports.testMediaConnectionBitrate = MediaConnectionBitrateTest_1.testMediaConnectionBitrate;
var VideoInputTest_1 = require("./VideoInputTest");
exports.testVideoInputDevice = VideoInputTest_1.testVideoInputDevice;
exports.VideoInputTest = VideoInputTest_1.VideoInputTest;
/**
 * If the `Twilio` object does not exist, make it.
 * Then, add the `Diagnostics` object to it.
 * This makes `window.Twilio.Diagnostics` available after loading the bundle in
 * the browser.
 */
window.Twilio = window.Twilio || {};
window.Twilio.Diagnostics = __assign(__assign({}, window.Twilio.Diagnostics), { testAudioInputDevice: AudioInputTest_1.testAudioInputDevice,
    testAudioOutputDevice: AudioOutputTest_1.testAudioOutputDevice,
    testMediaConnectionBitrate: MediaConnectionBitrateTest_1.testMediaConnectionBitrate,
    testVideoInputDevice: VideoInputTest_1.testVideoInputDevice });
//# sourceMappingURL=diagnostics.js.map