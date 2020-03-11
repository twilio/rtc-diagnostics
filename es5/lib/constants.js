"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pack = require("../package.json");
/**
 * @private
 * Max number of packets to send to data channel for bitrate test
 */
exports.MAX_NUMBER_PACKETS = 100;
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
 * Test names.
 */
var TestNames;
(function (TestNames) {
    TestNames["InputAudioDevice"] = "input-volume";
    TestNames["OutputAudioDevice"] = "output-volume";
})(TestNames = exports.TestNames || (exports.TestNames = {}));
//# sourceMappingURL=constants.js.map