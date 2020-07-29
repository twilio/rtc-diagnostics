"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pack = require("../package.json");
/**
 * @private
 * Parameters passed to our audio encoder
 * buffer size, input channels, output channes
 */
exports.ENCODER_PARAMS = [2048, 1, 1];
/**
 * @private
 * Max number of packets to send to data channel for bitrate test
 */
exports.MAX_NUMBER_PACKETS = 100;
/**
 * @private
 * Minimum bitrate required to pass bitrate test
 * See https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements#network-bandwidth-requirements
 */
exports.MIN_BITRATE_THRESHOLD = 100;
/**
 * @private
 * Data channel buffered amount
 */
exports.BYTES_KEEP_BUFFERED = 1024 * exports.MAX_NUMBER_PACKETS;
/**
 * @private
 * Test packet used for bitrate test
 */
exports.TEST_PACKET = Array(1024).fill('h').join('');
/**
 * @private
 * We are unable to use the `.ogg` file here in Safari.
 */
exports.INCOMING_SOUND_URL = "https://sdk.twilio.com/js/client/sounds/releases/1.0.0/incoming.mp3?cache=" + pack.name + "+" + pack.version;
/**
 * @private
 * The number of milliseconds to wait to receive data in bitrate test before timing out.
 */
exports.BITRATE_TEST_TIMEOUT_MS = 15000;
/**
 * @private
 * Test names.
 */
var TestName;
(function (TestName) {
    TestName["InputAudioDevice"] = "input-volume";
    TestName["OutputAudioDevice"] = "output-volume";
})(TestName = exports.TestName || (exports.TestName = {}));
/**
 * All of the expected error names to be thrown by the diagnostics tests.
 * These names are set in the error objects as the `.name` member.
 */
var ErrorName;
(function (ErrorName) {
    ErrorName["AlreadyStoppedError"] = "already-stopped";
    ErrorName["DiagnosticError"] = "diagnostic";
    ErrorName["InvalidOptionError"] = "invalid-option";
    ErrorName["InvalidOptionsError"] = "invalid-options";
    ErrorName["InvalidStateError"] = "invalid-state";
    ErrorName["PromiseTimedOutError"] = "promise-timed-out";
    ErrorName["UnsupportedError"] = "unsupported";
})(ErrorName = exports.ErrorName || (exports.ErrorName = {}));
/**
 * All of the expected warnings to be thrown by the diagnostics tests.
 */
var WarningName;
(function (WarningName) {
    /**
     * The `low-audio-level` warning is raised when the volume events recorded
     * by the input audio device test [[InputTest]] are both low and constant.
     *
     * The warning criteria is when the following are all true:
     * - If there are at least three seconds worth of audio samples.
     * - The standard deviation of those samples is less than 1% of the max
     *   possible volume value (255).
     * - The average of those samples is less than 1% of the max possible volume
     *   value (255).
     *
     * When any of the previous criteria are no longer met, the `warning-cleared`
     * event for `low-audio-level` is raised if `low-audio-level` has been raised.
     * Only one `low-audio-level` warning will be raised until the
     * `warning-cleared` event has been raised.
     */
    WarningName["LowAudioLevel"] = "low-audio-level";
})(WarningName = exports.WarningName || (exports.WarningName = {}));
//# sourceMappingURL=constants.js.map