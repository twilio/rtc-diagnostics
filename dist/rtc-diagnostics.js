/*! rtc-diagnostics.js 1.0.0-rc2

The following license applies to all parts of this software except as
documented below.

    Copyright (C) 2019-2020 Twilio, inc.
 
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
 
        http://www.apache.org/licenses/LICENSE-2.0
 
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

*/
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var constants_1 = require("./constants");
var DiagnosticError_1 = require("./errors/DiagnosticError");
/**
 * BitrateTest uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * connected via a [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn).
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 * See [[BitrateTest.Options.iceServers]] for information how to use Twilio NTS.
 */
var BitrateTest = /** @class */ (function (_super) {
    __extends(BitrateTest, _super);
    /**
     * Construct a [[BitrateTest]] instance. The test will start immediately.
     * Test should be allowed to run for a minimum of 8 seconds. To stop the test, call [[BitrateTest.stop]].
     * @constructor
     * @param options
     */
    function BitrateTest(options) {
        var _this = _super.call(this) || this;
        /**
         * Errors detected during the test
         */
        _this._errors = [];
        /**
         * Number of bytes received the last time it was checked
         */
        _this._lastBytesChecked = 0;
        /**
         * Last timestamp when the bytes received was checked
         */
        _this._lastCheckedTimestamp = 0;
        /**
         * Network related timing for this test
         */
        _this._networkTiming = {};
        /**
         * RTC configuration that will be used when initializing a RTCPeerConnection
         */
        _this._rtcConfiguration = {};
        /**
         * Timing measurements for this test
         */
        _this._testTiming = { start: 0 };
        /**
         * Total number of bytes received by the receiver RTCPeerConnection
         */
        _this._totalBytesReceived = 0;
        /**
         * Bitrate (kbps) values collected during the test
         */
        _this._values = [];
        /**
         * Warnings detected during the test
         */
        _this._warnings = [];
        options = options || {};
        _this._rtcConfiguration.iceServers = options.iceServers;
        _this._pcReceiver = new RTCPeerConnection(_this._rtcConfiguration);
        _this._pcSender = new RTCPeerConnection(_this._rtcConfiguration);
        _this._pcReceiver.onicecandidate = function (event) { return _this._onIceCandidate(_this._pcSender, event); };
        _this._pcSender.onicecandidate = function (event) { return _this._onIceCandidate(_this._pcReceiver, event); };
        _this._setupNetworkListeners(_this._pcSender);
        // Return before starting the test to allow consumer
        // to listen and capture errors
        setTimeout(function () {
            _this._setupDataChannel();
            _this._startTest();
        });
        return _this;
    }
    /**
     * Stops the current test.
     */
    BitrateTest.prototype.stop = function () {
        clearInterval(this._sendDataIntervalId);
        clearInterval(this._checkBitrateIntervalId);
        this._pcSender.close();
        this._pcReceiver.close();
        this._testTiming.end = Date.now();
        this._testTiming.duration = this._testTiming.end - this._testTiming.start;
        this.emit(BitrateTest.Events.End, this._getReport());
    };
    /**
     * Calculate bitrate by comparing bytes received between current time and the last time it was checked
     */
    BitrateTest.prototype._checkBitrate = function () {
        // No data yet
        if (!this._lastCheckedTimestamp || !this._lastBytesChecked) {
            this._lastCheckedTimestamp = Date.now();
            this._lastBytesChecked = this._totalBytesReceived;
            return;
        }
        // Calculate bitrate in kbps
        var now = Date.now();
        var bitrate = 8 * (this._totalBytesReceived - this._lastBytesChecked) / (now - this._lastCheckedTimestamp);
        this._lastCheckedTimestamp = now;
        this._lastBytesChecked = this._totalBytesReceived;
        this._values.push(bitrate);
        this.emit(BitrateTest.Events.Bitrate, bitrate);
    };
    /**
     * Generate and returns the report for this test
     */
    BitrateTest.prototype._getReport = function () {
        var averageBitrate = this._values
            .reduce(function (total, value) { return total += value; }, 0) / this._values.length;
        averageBitrate = isNaN(averageBitrate) ? 0 : averageBitrate;
        return {
            averageBitrate: averageBitrate,
            didPass: !this._errors.length && !!this._values.length && averageBitrate >= constants_1.MIN_BITRATE_THRESHOLD,
            errors: this._errors,
            networkTiming: this._networkTiming,
            testName: BitrateTest.testName,
            testTiming: this._testTiming,
            values: this._values,
            warnings: this._warnings,
        };
    };
    /**
     * Emit a warning if currentStatValue exceeds threshold value
     * @param name
     * @param currentStatValue
     */
    BitrateTest.prototype._maybeEmitWarning = function (name, currentStatValue) {
        if (currentStatValue > BitrateTest.WarningThresholds[name]) {
            this._warnings.push(name);
            this.emit(BitrateTest.Events.Warning, name);
        }
    };
    /**
     * Called when an error is detected
     * @param message - Message that describes the error
     * @param error - The error object
     * @param isFatal - Whether this is a fatal error
     */
    BitrateTest.prototype._onError = function (message, error) {
        var diagnosticError = new DiagnosticError_1.DiagnosticError(error, message);
        this._errors.push(diagnosticError);
        this.emit(BitrateTest.Events.Error, diagnosticError);
        this.stop();
    };
    /**
     * Called when a local candidate is gathered
     * @param remotePc - The remote RTCPeerConnection
     */
    BitrateTest.prototype._onIceCandidate = function (remotePc, event) {
        var _this = this;
        if (event.candidate) {
            var candidate = event.candidate.candidate;
            if (candidate.indexOf('relay') !== -1) {
                remotePc.addIceCandidate(event.candidate)
                    .catch(function (error) { return _this._onError('Unable to add candidate', error); });
            }
        }
    };
    /**
     * Called when a message is received
     * @param event
     */
    BitrateTest.prototype._onMessageReceived = function (event) {
        this._totalBytesReceived += event.data.length;
        if (!this._networkTiming.firstPacket) {
            this._networkTiming.firstPacket = Date.now();
            this._maybeEmitWarning(BitrateTest.Warnings.HighFirstPacketDuration, this._networkTiming.firstPacket - this._testTiming.start);
        }
    };
    /**
     * Called when an answer is created by the receiver
     * @param answer - The answer session description created by the receiver RTCPeerConnection
     */
    BitrateTest.prototype._onReceiverAnswerCreated = function (answer) {
        var _this = this;
        return Promise.all([
            this._pcReceiver.setLocalDescription(answer),
            this._pcSender.setRemoteDescription(answer),
        ]).catch(function (error) {
            return _this._onError('Unable to set local or remote description from createAnswer', error);
        });
    };
    /**
     * Called when an offer has been created by the sender
     * @param offer - The offer session description created by the sender RTCPeerConnection
     */
    BitrateTest.prototype._onSenderOfferCreated = function (offer) {
        var _this = this;
        return Promise.all([
            this._pcSender.setLocalDescription(offer),
            this._pcReceiver.setRemoteDescription(offer),
        ]).catch(function (error) {
            return _this._onError('Unable to set local or remote description from createOffer', error);
        });
    };
    /**
     * Send packets using data channel
     */
    BitrateTest.prototype._sendData = function () {
        if (!this._rtcDataChannel || this._rtcDataChannel.readyState !== 'open') {
            return;
        }
        for (var i = 0; i < constants_1.MAX_NUMBER_PACKETS; ++i) {
            if (this._rtcDataChannel.bufferedAmount >= constants_1.BYTES_KEEP_BUFFERED) {
                break;
            }
            this._rtcDataChannel.send(constants_1.TEST_PACKET);
        }
    };
    /**
     * Setup data channel for sending data
     */
    BitrateTest.prototype._setupDataChannel = function () {
        var _this = this;
        try {
            this._rtcDataChannel = this._pcSender.createDataChannel('sender');
        }
        catch (e) {
            this._onError('Error creating data channel', e);
            return;
        }
        this._rtcDataChannel.onopen = function () {
            _this._sendDataIntervalId = setInterval(function () { return _this._sendData(); }, 1);
            _this._checkBitrateIntervalId = setInterval(function () { return _this._checkBitrate(); }, 1000);
        };
        this._pcReceiver.ondatachannel = function (dataChannelEvent) {
            dataChannelEvent.channel.onmessage = function (event) { return _this._onMessageReceived(event); };
        };
    };
    /**
     * Setup network related event listeners on a PeerConnection
     * @param pc
     */
    BitrateTest.prototype._setupNetworkListeners = function (pc) {
        var _this = this;
        // PeerConnection state
        pc.onconnectionstatechange = function () {
            _this._networkTiming.peerConnection = _this._networkTiming.peerConnection || { start: 0 };
            if (pc.connectionState === 'connecting') {
                _this._networkTiming.peerConnection.start = Date.now();
            }
            else if (pc.connectionState === 'connected') {
                _this._networkTiming.peerConnection.end = Date.now();
                var _a = _this._networkTiming.peerConnection, start = _a.start, end = _a.end;
                var duration = end - start;
                _this._networkTiming.peerConnection.duration = duration;
                _this._maybeEmitWarning(BitrateTest.Warnings.HighPcConnectDuration, duration);
            }
        };
        // ICE Connection state
        pc.oniceconnectionstatechange = function () {
            _this._networkTiming.ice = _this._networkTiming.ice || { start: 0 };
            if (pc.iceConnectionState === 'checking') {
                _this._networkTiming.ice.start = Date.now();
            }
            else if (pc.iceConnectionState === 'connected') {
                _this._networkTiming.ice.end = Date.now();
                var _a = _this._networkTiming.ice, start = _a.start, end = _a.end;
                var duration = end - start;
                _this._networkTiming.ice.duration = duration;
                _this._maybeEmitWarning(BitrateTest.Warnings.HighIceConnectDuration, duration);
            }
        };
    };
    /**
     * Starts the test.
     */
    BitrateTest.prototype._startTest = function () {
        var _this = this;
        this._testTiming.start = Date.now();
        if (!this._rtcConfiguration.iceServers) {
            return this._onError('No iceServers found', undefined);
        }
        this._pcSender.createOffer()
            .then(function (offer) { return _this._onSenderOfferCreated(offer); })
            .then(function () {
            return _this._pcReceiver.createAnswer()
                .then(function (answer) { return _this._onReceiverAnswerCreated(answer); })
                .catch(function (error) { return _this._onError('Unable to create answer', error); });
        }).catch(function (error) { return _this._onError('Unable to create offer', error); });
    };
    /**
     * Name of this test
     */
    BitrateTest.testName = 'bitrate-test';
    return BitrateTest;
}(events_1.EventEmitter));
exports.BitrateTest = BitrateTest;
(function (BitrateTest) {
    var _a;
    /**
     * Possible events that a [[BitrateTest]] might emit. See [[BitrateTest.on]].
     */
    var Events;
    (function (Events) {
        Events["Bitrate"] = "bitrate";
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Warning"] = "warning";
    })(Events = BitrateTest.Events || (BitrateTest.Events = {}));
    /**
     * Possible warnings that a [[BitrateTest]] might emit. See [[BitrateTest.on]].
     */
    var Warnings;
    (function (Warnings) {
        /**
         * Raised when [[NetworkTiming.firstPacket]] took more than 1400ms to arrive to the remote RTCPeerConnection.
         * The duration is measured from the [[BitrateTest.Report]]'s testTiming.start up to [[NetworkTiming.firstPacket]]
         */
        Warnings["HighFirstPacketDuration"] = "high-first-packet-duration";
        /**
         * Raised when [[NetworkTiming.ice]] connection took more than 300ms to establish
         */
        Warnings["HighIceConnectDuration"] = "high-ice-connect-duration";
        /**
         * Raised when [[NetworkTiming.peerConnection]] took more than 1000ms to establish
         */
        Warnings["HighPcConnectDuration"] = "high-pc-connect-duration";
    })(Warnings = BitrateTest.Warnings || (BitrateTest.Warnings = {}));
    /**
     * Thresholds used for determining when to raise a warning. See [[BitrateTest.Warnings]]
     * @internalapi
     */
    BitrateTest.WarningThresholds = (_a = {},
        _a[Warnings.HighFirstPacketDuration] = 1400,
        _a[Warnings.HighIceConnectDuration] = 300,
        _a[Warnings.HighPcConnectDuration] = 1000,
        _a);
})(BitrateTest = exports.BitrateTest || (exports.BitrateTest = {}));
exports.BitrateTest = BitrateTest;
/**
 * The test uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) connected via a Twilio TURN server.
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 *
 * Example:
 * ```ts
 *   import { testBitrate } from '@twilio/rtc-diagnostics';
 *
 *   const bitrateTest = testBitrate({
 *     iceServers: [{
 *       credential: 'bar',
 *       username: 'foo',
 *       urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 *     }],
 *   });
 *
 *   bitrateTest.on('bitrate', (bitrate) => {
 *     console.log(bitrate);
 *   });
 *
 *   bitrateTest.on('error', (error) => {
 *     console.log(error);
 *   });
 *
 *   bitrateTest.on('end', (report) => {
 *     console.log(report);
 *   });
 *
 *   // Run the test for 15 seconds
 *   setTimeout(() => {
 *     bitrateTest.stop();
 *   }, 15000);
 * ```
 * See [[BitrateTest.Options.iceServers]] for details on how to obtain TURN credentials.
 */
function testBitrate(options) {
    return new BitrateTest(options);
}
exports.testBitrate = testBitrate;

},{"./constants":4,"./errors/DiagnosticError":7,"events":22}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var constants_1 = require("./constants");
var errors_1 = require("./errors");
var polyfills_1 = require("./polyfills");
var utils_1 = require("./utils");
var optionValidation_1 = require("./utils/optionValidation");
/**
 * [[InputTest]] class that parses options and starts an audio input device
 * test.
 *
 * Please see [[testInputDevice]] for details and recommended practices.
 */
var InputTest = /** @class */ (function (_super) {
    __extends(InputTest, _super);
    /**
     * Initializes the `startTime` and `options`.
     * @param options Optional settings to pass to the test.
     */
    function InputTest(options) {
        var _this = _super.call(this) || this;
        /**
         * An `AudioContext` to use for generating volume levels.
         */
        _this._audioContext = null;
        /**
         * A function that will be assigned in `_startTest` that when run will clean
         * up the audio nodes created in the same function.
         */
        _this._cleanupAudio = null;
        /**
         * The default media devices when starting the test.
         */
        _this._defaultDevices = {};
        /**
         * A timestamp that is set when the test ends.
         */
        _this._endTime = null;
        /**
         * An array of any errors that occur during the run time of the test.
         */
        _this._errors = [];
        /**
         * The maximum volume level from the audio source.
         */
        _this._maxValue = 0;
        /**
         * A `MediaStream` that is created from the input device.
         */
        _this._mediaStream = null;
        /**
         * Volume levels generated from the audio source during the run time of the
         * test.
         */
        _this._values = [];
        /**
         * The timeout that causes the volume event to loop; created by `setTimeout`.
         */
        _this._volumeTimeout = null;
        _this._options = __assign(__assign({}, InputTest.defaultOptions), options);
        // We need to use a `setTimeout` here to prevent a race condition.
        // This allows event listeners to bind before the test starts.
        setTimeout(function () { return _this._startTest(); });
        return _this;
    }
    /**
     * Stop the currently running `InputTest`.
     * @param pass whether or not the test should pass. If set to false, will
     * override the result from determining whether audio is silent from the collected volume levels.
     */
    InputTest.prototype.stop = function (pass) {
        if (pass === void 0) { pass = true; }
        if (this._endTime) {
            this._onWarning(new errors_1.AlreadyStoppedError());
            return;
        }
        // Perform cleanup
        this._cleanup();
        this._endTime = Date.now();
        var didPass = pass && !utils_1.detectSilence(this._values);
        var report = {
            deviceId: this._options.deviceId || (this._defaultDevices.audioinput &&
                this._defaultDevices.audioinput.deviceId),
            didPass: didPass,
            errors: this._errors,
            testName: InputTest.testName,
            values: this._values,
        };
        if (this._startTime) {
            report.testTiming = {
                duration: this._endTime - this._startTime,
                end: this._endTime,
                start: this._startTime,
            };
        }
        this.emit(InputTest.Events.End, report);
        return report;
    };
    /**
     * Clean up any instantiated objects (i.e. `AudioContext`, `MediaStreams`,
     * etc.).
     * Called by `.stop`.
     */
    InputTest.prototype._cleanup = function () {
        if (this._volumeTimeout) {
            clearTimeout(this._volumeTimeout);
        }
        if (this._cleanupAudio) {
            this._cleanupAudio();
        }
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach(function (track) { return track.stop(); });
        }
        if (this._audioContext) {
            this._audioContext.close();
        }
    };
    /**
     * Helper function that should be called when an error occurs, recoverable
     * or not.
     * @param error
     */
    InputTest.prototype._onError = function (error) {
        this._errors.push(error);
        this.emit(InputTest.Events.Error, error);
    };
    /**
     * Called every `InputTest._options.volumeEventIntervalMs` amount of
     * milliseconds, emits the volume passed to it as a `Events.Volume` event.
     * @param value the volume
     */
    InputTest.prototype._onVolume = function (value) {
        if (value > this._maxValue) {
            this._maxValue = value;
        }
        this._values.push(value);
        this.emit(InputTest.Events.Volume, value);
    };
    /**
     * Warning event handler.
     * @param warning
     */
    InputTest.prototype._onWarning = function (error) {
        if (this._options.debug) {
            // tslint:disable-next-line no-console
            console.warn(error);
        }
    };
    /**
     * Entry point into the input device test. Uses the `MediaStream` that the
     * object was set up with, and performs a fourier transform on the audio data
     * using an `AnalyserNode`. The output of the fourier transform are the
     * relative amplitudes of the frequencies of the audio data. The average of
     * this data can then be used as an estimate as the average volume of the
     * entire volume source.
     *
     * @event Events.Volume
     */
    InputTest.prototype._startTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var invalidReasons, _a, _b, _c, analyser_1, microphone_1, frequencyDataBytes_1, volumeEvent_1, error_1;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, optionValidation_1.validateOptions(this._options, {
                                deviceId: optionValidation_1.validateDeviceId,
                                duration: optionValidation_1.validateTime,
                                volumeEventIntervalMs: optionValidation_1.validateTime,
                            })];
                    case 1:
                        invalidReasons = _d.sent();
                        if (invalidReasons) {
                            throw new errors_1.InvalidOptionsError(invalidReasons);
                        }
                        if (!this._options.getUserMedia) {
                            throw polyfills_1.GetUserMediaUnsupportedError;
                        }
                        _a = this;
                        return [4 /*yield*/, this._options.getUserMedia({
                                audio: { deviceId: this._options.deviceId },
                            })];
                    case 2:
                        _a._mediaStream = _d.sent();
                        if (!this._options.enumerateDevices) {
                            throw polyfills_1.EnumerateDevicesUnsupportedError;
                        }
                        _b = this;
                        _c = polyfills_1.getDefaultDevices;
                        return [4 /*yield*/, this._options.enumerateDevices()];
                    case 3:
                        _b._defaultDevices = _c.apply(void 0, [_d.sent()]);
                        // Only starts the timer after successfully getting devices
                        this._startTime = Date.now();
                        if (!this._options.audioContextFactory) {
                            throw polyfills_1.AudioContextUnsupportedError;
                        }
                        this._audioContext = new this._options.audioContextFactory();
                        analyser_1 = this._audioContext.createAnalyser();
                        analyser_1.smoothingTimeConstant = 0.4;
                        analyser_1.fftSize = 64;
                        microphone_1 = this._audioContext.createMediaStreamSource(this._mediaStream);
                        microphone_1.connect(analyser_1);
                        this._cleanupAudio = function () {
                            analyser_1.disconnect();
                            microphone_1.disconnect();
                        };
                        frequencyDataBytes_1 = new Uint8Array(analyser_1.frequencyBinCount);
                        volumeEvent_1 = function () {
                            if (_this._endTime) {
                                return;
                            }
                            analyser_1.getByteFrequencyData(frequencyDataBytes_1);
                            var volume = frequencyDataBytes_1.reduce(function (sum, val) { return sum + val; }, 0) / frequencyDataBytes_1.length;
                            _this._onVolume(volume);
                            if (Date.now() - _this._startTime > _this._options.duration) {
                                _this.stop();
                            }
                            else {
                                _this._volumeTimeout = setTimeout(volumeEvent_1, _this._options.volumeEventIntervalMs);
                            }
                        };
                        this._volumeTimeout = setTimeout(volumeEvent_1, this._options.volumeEventIntervalMs);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _d.sent();
                        if (error_1 instanceof errors_1.DiagnosticError) {
                            // There is some other fatal error.
                            this._onError(error_1);
                        }
                        else if (typeof DOMException !== 'undefined' && error_1 instanceof DOMException) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'A `DOMException` has occurred.'));
                        }
                        else if (typeof DOMError !== 'undefined' && error_1 instanceof DOMError) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'A `DOMError` has occurred.'));
                        }
                        else {
                            this._onError(new errors_1.DiagnosticError(undefined, 'Unknown error occurred.'));
                            this._onWarning(error_1);
                        }
                        this.stop(false);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Name of the test.
     */
    InputTest.testName = constants_1.TestNames.InputAudioDevice;
    /**
     * Default options for the `InputTest`.
     */
    InputTest.defaultOptions = {
        audioContextFactory: polyfills_1.AudioContext,
        debug: false,
        duration: Infinity,
        enumerateDevices: polyfills_1.enumerateDevices,
        getUserMedia: polyfills_1.getUserMedia,
        volumeEventIntervalMs: 100,
    };
    return InputTest;
}(events_1.EventEmitter));
exports.InputTest = InputTest;
(function (InputTest) {
    /**
     * Possible events that an `InputTest` might emit. See [[InputTest.on]].
     */
    var Events;
    (function (Events) {
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Volume"] = "volume";
    })(Events = InputTest.Events || (InputTest.Events = {}));
})(InputTest = exports.InputTest || (exports.InputTest = {}));
exports.InputTest = InputTest;
/**
 * [[InputTest]] tests audio input capabilities. It serves to help diagnose
 * potential audio device issues that would prevent audio from being recognized
 * in a WebRTC call.
 *
 * ---
 *
 * The [[InputTest]] class is an `EventEmitter` (please see [[InputTest.on]] for
 * events and their details) and helps to diagnose issues by capturing user
 * audio and emitting the volume levels detected in that media.
 * ```ts
 * import { InputTest, testInputDevice } from '@twilio/rtc-diagnostics';
 * const options: InputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const inputTest: InputTest = testInputDevice(options);
 * ```
 * Applications can use the volume events emitted by the test to update their UI
 * to show to the user whether or not their media was captured successfully.
 * ```ts
 * inputTest.on(InputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 * The test can be normally stopped two ways: allowing the test to time out and
 * stopping the test manually.
 *
 * If the test was allowed to time out, the value of
 * [[InputTest.Report.didPass]] will be determined by the ratio of silent volume
 * values in the captured media.
 *
 * To end the test manually, the application can ask the end-user to confirm
 * that the volume levels it emits are what the end-user expects. If so, the
 * application can call the [[InputTest.stop]] method with `true`. Otherwise,
 * if the audio values are not expected, the application can call
 * [[InputTest.stop]] with `false`.
 * ```ts
 * // The UI should indicate that if the volume values are what the user
 * // expects, they can click this button to pass and stop the test...
 * const volumeCorrectButton = ...;
 * volumeCorrectButton.addEventListener('click', () => {
 *   inputTest.stop(true);
 * });
 *
 * // ...otherwise, if the volume levels are not what they expect, they can
 * // click this.
 * const volumeIncorrectButton = ...;
 * volumeIncorrectButton.addEventListener('click', () => {
 *   inputTest.stop(false);
 * });
 * ```
 * Calling [[InputTest.stop]] will immediately end the test. The value of
 * [[InputTest.Report.didPass]] is determined from the ratio of silent audio
 * levels detected in the user media, but overwritten by passing `false` to
 * [[InputTest.stop]].
 *
 * ---
 *
 * The [[InputTest]] object will always emit a [[InputTest.Report]] with the
 * [[InputTest.Events.End]] event, regardless of the occurrence of errors during
 * the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that the
 * value of [[InputTest.Report.didPass]] will be `false` and the value of
 * [[InputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[InputTest.Report.errors]] upon completion of the test.
 *
 * ---
 *
 * The function [[testInputDevice]] serves as a factory function that accepts
 * [[InputTest.Options]] as its only parameter and will instantiate an
 * [[InputTest]] object with those options.
 * ```ts
 * import { InputTest, testInputDevice } from '@twilio/rtc-diagnostics';
 * const options: InputTest.Options = { ... };
 * const inputTest: InputTest = testInputDevice(options);
 * ```
 *
 * @param options Options to pass to the [[InputTest]] constructor.
 */
function testInputDevice(options) {
    return new InputTest(options);
}
exports.testInputDevice = testInputDevice;

},{"./constants":4,"./errors":13,"./polyfills":18,"./utils":19,"./utils/optionValidation":20,"events":22}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var constants_1 = require("./constants");
var errors_1 = require("./errors");
var polyfills_1 = require("./polyfills");
var optionValidation_1 = require("./utils/optionValidation");
/**
 * [[OutputTest]] class that parses options and starts an audio output device
 * test.
 *
 * Please see [[testOutputDevice]] for details and recommended practices.
 */
var OutputTest = /** @class */ (function (_super) {
    __extends(OutputTest, _super);
    /**
     * Sets up several things for the `OutputTest` to run later in the
     * `_startTest` function.
     * @param options Optional settings to pass to the test.
     */
    function OutputTest(options) {
        var _this = _super.call(this) || this;
        /**
         * Holds `AudioElement`s that are attached to the DOM to load and play audio.
         */
        _this._audio = [];
        /**
         * An `AudioContext` that is used to process the audio source.
         */
        _this._audioContext = null;
        /**
         * The default media devices when starting the test.
         */
        _this._defaultDevices = {};
        /**
         * A timestamp of when the test ends.
         */
        _this._endTime = null;
        /**
         * An array of errors encountered by the test during its run time.
         */
        _this._errors = [];
        /**
         * Volume values generated by the test over its run time.
         */
        _this._values = [];
        /**
         * Timeout created by `setTimeout`, used to loop the volume logic.
         */
        _this._volumeTimeout = null;
        _this._options = __assign(__assign({}, OutputTest.defaultOptions), options);
        _this._startTime = Date.now();
        // We need to use a `setTimeout` here to prevent a race condition.
        // This allows event listeners to bind before the test starts.
        setTimeout(function () { return _this._startTest(); });
        return _this;
    }
    /**
     * Stops the test.
     * @param pass whether or not the test should pass. If set to false, will
     * override the result from determining whether audio is silent from the collected volume values.
     */
    OutputTest.prototype.stop = function (pass) {
        if (pass === void 0) { pass = true; }
        if (this._endTime) {
            this._onWarning(new errors_1.AlreadyStoppedError());
            return;
        }
        // Clean up the test.
        this._cleanup();
        this._endTime = Date.now();
        var report = {
            deviceId: this._options.deviceId || (this._defaultDevices.audiooutput &&
                this._defaultDevices.audiooutput.deviceId),
            didPass: pass,
            errors: this._errors,
            testName: OutputTest.testName,
            testTiming: {
                duration: this._endTime - this._startTime,
                end: this._endTime,
                start: this._startTime,
            },
            testURI: this._options.testURI,
            values: this._values,
        };
        this.emit(OutputTest.Events.End, report);
        return report;
    };
    /**
     * Cleanup the test.
     */
    OutputTest.prototype._cleanup = function () {
        if (this._volumeTimeout) {
            clearTimeout(this._volumeTimeout);
        }
        if (this._audioContext) {
            this._audioContext.close();
        }
        this._audio.forEach(function (audio) {
            audio.pause();
        });
    };
    /**
     * Error event handler. Adds the error to the internal list of errors that is
     * forwarded in the report.
     * @param error
     */
    OutputTest.prototype._onError = function (error) {
        this._errors.push(error);
        this.emit(OutputTest.Events.Error, error);
    };
    /**
     * Volume event handler, adds the value to the list `_values` and emits it
     * under the event `volume`.
     * @param volume
     */
    OutputTest.prototype._onVolume = function (volume) {
        this._values.push(volume);
        this.emit(OutputTest.Events.Volume, volume);
    };
    /**
     * Warning event handler.
     * @param warning
     */
    OutputTest.prototype._onWarning = function (error) {
        if (this._options.debug) {
            // tslint:disable-next-line no-console
            console.warn(error);
        }
    };
    /**
     * Entry point of the test, called after setup in the constructor.
     * Emits the volume levels of the audio.
     *
     * @event [[OutputTest.Events.Volume]]
     */
    OutputTest.prototype._startTest = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var invalidReasons, setSinkIdSupported, devices, numberOutputDevices, sourceAudio_1, sourceNode, analyser_1, frequencyDataBytes_1, volumeEvent_1, destinationNode, destinationAudio, error_1;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, optionValidation_1.validateOptions(this._options, {
                                deviceId: optionValidation_1.validateDeviceId,
                                duration: optionValidation_1.validateTime,
                                volumeEventIntervalMs: optionValidation_1.validateTime,
                            })];
                    case 1:
                        invalidReasons = _c.sent();
                        if (invalidReasons) {
                            throw new errors_1.InvalidOptionsError(invalidReasons);
                        }
                        if (!this._options.audioElementFactory) {
                            throw polyfills_1.AudioUnsupportedError;
                        }
                        if (!this._options.audioContextFactory) {
                            throw polyfills_1.AudioContextUnsupportedError;
                        }
                        setSinkIdSupported = typeof this._options.audioElementFactory.prototype.setSinkId === 'function';
                        if (!setSinkIdSupported) return [3 /*break*/, 3];
                        if (!this._options.enumerateDevices) {
                            throw polyfills_1.EnumerateDevicesUnsupportedError;
                        }
                        return [4 /*yield*/, this._options.enumerateDevices()];
                    case 2:
                        devices = _c.sent();
                        numberOutputDevices = devices.filter(function (device) { return device.kind === 'audiooutput'; }).length;
                        if (numberOutputDevices === 0) {
                            throw new errors_1.DiagnosticError(undefined, 'No output devices found.');
                        }
                        this._defaultDevices = polyfills_1.getDefaultDevices(devices);
                        _c.label = 3;
                    case 3:
                        this._audioContext = new this._options.audioContextFactory();
                        sourceAudio_1 = new this._options.audioElementFactory(this._options.testURI);
                        sourceAudio_1.setAttribute('crossorigin', 'anonymous');
                        sourceAudio_1.loop = !!this._options.doLoop;
                        sourceNode = this._audioContext.createMediaElementSource(sourceAudio_1);
                        analyser_1 = this._audioContext.createAnalyser();
                        analyser_1.smoothingTimeConstant = 0.4;
                        analyser_1.fftSize = 64;
                        sourceNode.connect(analyser_1);
                        frequencyDataBytes_1 = new Uint8Array(analyser_1.frequencyBinCount);
                        volumeEvent_1 = function () {
                            if (_this._endTime) {
                                return;
                            }
                            analyser_1.getByteFrequencyData(frequencyDataBytes_1);
                            var volume = frequencyDataBytes_1.reduce(function (sum, val) { return sum + val; }, 0) / frequencyDataBytes_1.length;
                            _this._onVolume(volume);
                            // Check stop conditions
                            var isTimedOut = Date.now() - _this._startTime > _this._options.duration;
                            var stop = _this._options.doLoop
                                ? isTimedOut
                                : sourceAudio_1.ended || isTimedOut;
                            if (stop) {
                                if (_this._options.passOnTimeout === false) {
                                    _this._onError(new errors_1.DiagnosticError(undefined, 'Test timed out.'));
                                }
                                _this.stop(_this._options.passOnTimeout);
                            }
                            else {
                                _this._volumeTimeout = setTimeout(volumeEvent_1, _this._options.volumeEventIntervalMs);
                            }
                        };
                        if (!(this._options.deviceId && setSinkIdSupported)) return [3 /*break*/, 6];
                        destinationNode = this._audioContext.createMediaStreamDestination();
                        analyser_1.connect(destinationNode);
                        destinationAudio = new this._options.audioElementFactory();
                        destinationAudio.loop = !!this._options.doLoop;
                        destinationAudio.srcObject = destinationNode.stream;
                        return [4 /*yield*/, ((_b = (_a = destinationAudio).setSinkId) === null || _b === void 0 ? void 0 : _b.call(_a, this._options.deviceId))];
                    case 4:
                        _c.sent();
                        return [4 /*yield*/, destinationAudio.play()];
                    case 5:
                        _c.sent();
                        this._audio.push(destinationAudio);
                        return [3 /*break*/, 7];
                    case 6:
                        if (this._options.deviceId && !setSinkIdSupported) {
                            // Non-fatal error
                            this._onError(new errors_1.UnsupportedError('A `deviceId` was passed to the `OutputTest` but `setSinkId` is ' +
                                'not supported in this browser.'));
                        }
                        analyser_1.connect(this._audioContext.destination);
                        _c.label = 7;
                    case 7: return [4 /*yield*/, sourceAudio_1.play()];
                    case 8:
                        _c.sent();
                        this._audio.push(sourceAudio_1);
                        this._volumeTimeout = setTimeout(volumeEvent_1, this._options.volumeEventIntervalMs);
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _c.sent();
                        if (error_1 instanceof errors_1.DiagnosticError) {
                            this._onError(error_1);
                        }
                        else if (typeof DOMException !== 'undefined' && error_1 instanceof DOMException) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'A DOMException has occurred.'));
                        }
                        else if (typeof DOMError !== 'undefined' && error_1 instanceof DOMError) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'A DOMError has occurred.'));
                        }
                        else {
                            this._onError(new errors_1.DiagnosticError(undefined, 'Unknown error occurred.'));
                            this._onWarning(error_1);
                        }
                        this.stop(false);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * The name of the test.
     */
    OutputTest.testName = constants_1.TestNames.OutputAudioDevice;
    /**
     * Default options for the [[OutputTest]]. Overwritten by any option passed
     * during the construction of the test.
     */
    OutputTest.defaultOptions = {
        audioContextFactory: polyfills_1.AudioContext,
        audioElementFactory: polyfills_1.Audio,
        debug: false,
        doLoop: true,
        duration: Infinity,
        enumerateDevices: polyfills_1.enumerateDevices,
        passOnTimeout: true,
        testURI: constants_1.INCOMING_SOUND_URL,
        volumeEventIntervalMs: 100,
    };
    return OutputTest;
}(events_1.EventEmitter));
exports.OutputTest = OutputTest;
(function (OutputTest) {
    /**
     * Events that the OutputTest will emit as it runs.
     * Please see [[OutputTest.on]] for how to listen to these
     * events.
     */
    var Events;
    (function (Events) {
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Volume"] = "volume";
    })(Events = OutputTest.Events || (OutputTest.Events = {}));
})(OutputTest = exports.OutputTest || (exports.OutputTest = {}));
exports.OutputTest = OutputTest;
/**
 * [[OutputTest]] tests audio output capabilities. It serves to help diagnose
 * potential audio device issues that would prevent a user from being able to
 * hear audio.
 *
 * ---
 *
 * The [[OutputTest]] class is an `EventEmitter` (please see [[OutputTest.on]] for
 * events and their details) and helps to diagnose issues by playing a sound clip
 * (by default the sound clip is the ringing tone from the `twilio-client.js`
 * SDK) and emitting volume events of the sound clip as it plays.
 * ```ts
 * import { OutputTest, testOutputDevice } from '@twilio/rtc-diagnostics';
 * const options: OutputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const outputTest: OutputTest = testOutputDevice(options);
 * ```
 * The application can use the volume events to show in its UI that audio is
 * playing and that the end-user should be hearing something.
 * ```ts
 * outputTest.on(OutputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 *
 * The application should ask the end-user to confirm that the sound being played
 * can be heard. The application should call [[OutputTest.stop]] with `true` if
 * the end-user hears the sound, and `false` if not.
 * ```ts
 * // If the user was able to hear the audio, the UI should indicate they should
 * // click this button...
 * const passButton = ...;
 * passButton.on('click', () => {
 *   outputTest.stop(false);
 * });
 *
 * // ...conversely, if they were not able to hear the audio, they should click
 * // this one.
 * const failButton = ...;
 * failButton.on('click', () => {
 *   outputTest.stop(end);
 * });
 * ```
 * Caling [[OutputTest.stop]] will immediately end the test. The value of
 * [[OutputTest.Report.didPass]] will be the value passed to
 * [[OutputTest.stop]].
 *
 * ---
 *
 * The [[OutputTest]] object will always emit a [[OutputTest.Report]] with
 * the [[OutputTest.Events.End]] event, regardless of the occurence of errors
 * during the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that
 * the value of [[OutputTest.Report.didPass]] will be `false` and the value of
 * [[OutputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[OutputTest.Report.errors]] upon completion of the test.
 *
 * If the data at `testURI` is unable to be loaded, meaning the error event is
 * raised on the audio element, a fatal error has occurred.
 *
 * If `doLoop` is set to `false`, then the test will run for either the option
 * `duration`, or the full duration of the audio file, which ever is shorter.
 * If `doLoop` is set to `true`, it will only run as long as the `duration`
 * option.
 * If the test times out (as defined by the `duration` in the `options`
 * parameter), then the test is considered passing or not by the `passOnTimeout`
 * option and ends.
 *
 * ---
 *
 * The function [[testOutputDevice]] serves as factory function that accepts
 * [[OutputTest.Options]] as its only parameter and will instantiate an
 * [[OutputTest]] object with those options.
 * ```ts
 * import { OutputTest, testOutputDevice } from '@twilio/rtc-diagnostics';
 * const options: OutputTest.Options = { ... };
 * const outputTest: OutputTest = testOutputDevice(options);
 * ```
 * @param options Options to pass to the [[OutputTest]] constructor.
 */
function testOutputDevice(options) {
    return new OutputTest(options);
}
exports.testOutputDevice = testOutputDevice;

},{"./constants":4,"./errors":13,"./polyfills":18,"./utils/optionValidation":20,"events":22}],4:[function(require,module,exports){
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
 * Test names.
 */
var TestNames;
(function (TestNames) {
    TestNames["InputAudioDevice"] = "input-volume";
    TestNames["OutputAudioDevice"] = "output-volume";
})(TestNames = exports.TestNames || (exports.TestNames = {}));

},{"../package.json":21}],5:[function(require,module,exports){
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
var BitrateTest_1 = require("./BitrateTest");
exports.BitrateTest = BitrateTest_1.BitrateTest;
exports.testBitrate = BitrateTest_1.testBitrate;
var InputTest_1 = require("./InputTest");
exports.InputTest = InputTest_1.InputTest;
exports.testInputDevice = InputTest_1.testInputDevice;
var OutputTest_1 = require("./OutputTest");
exports.OutputTest = OutputTest_1.OutputTest;
exports.testOutputDevice = OutputTest_1.testOutputDevice;
/**
 * If the `Twilio` object does not exist, make it.
 * Then, add the `Diagnostics` object to it.
 * This makes `window.Twilio.Diagnostics` available after loading the bundle in
 * the browser.
 */
window.Twilio = window.Twilio || {};
window.Twilio.Diagnostics = __assign(__assign({}, window.Twilio.Diagnostics), { testBitrate: BitrateTest_1.testBitrate,
    testInputDevice: InputTest_1.testInputDevice,
    testOutputDevice: OutputTest_1.testOutputDevice });

},{"./BitrateTest":1,"./InputTest":2,"./OutputTest":3}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var InvalidStateError_1 = require("./InvalidStateError");
/**
 * @internalapi
 * Specific instance of a `InvalidStateError` that mostly occurs when a test
 * is stopped more than once.
 */
var AlreadyStoppedError = /** @class */ (function (_super) {
    __extends(AlreadyStoppedError, _super);
    function AlreadyStoppedError() {
        var _this = _super.call(this, 'This test already has a defined end timestamp. ' +
            'Tests should not be run multiple times, instead start a new one.') || this;
        _this.name = 'AlreadyStoppedError';
        return _this;
    }
    return AlreadyStoppedError;
}(InvalidStateError_1.InvalidStateError));
exports.AlreadyStoppedError = AlreadyStoppedError;

},{"./InvalidStateError":10}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internalapi
 * Generic Diagnostic SDK error that provides a superclass for all other errors.
 */
var DiagnosticError = /** @class */ (function (_super) {
    __extends(DiagnosticError, _super);
    /**
     * Immediately sets the timestamp and sets the name to `DiagnosticError`.
     * @param domError
     * @param message
     */
    function DiagnosticError(domError, message) {
        var _this = _super.call(this, message) || this;
        _this.timestamp = Date.now();
        _this.domError = domError;
        Object.setPrototypeOf(_this, DiagnosticError.prototype);
        _this.name = 'DiagnosticError';
        return _this;
    }
    return DiagnosticError;
}(Error));
exports.DiagnosticError = DiagnosticError;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 */
var InvalidOptionError = /** @class */ (function (_super) {
    __extends(InvalidOptionError, _super);
    function InvalidOptionError(option, reason, error) {
        var _this = this;
        var domError = (typeof DOMError !== 'undefined' && error instanceof DOMError) ||
            (typeof DOMException !== 'undefined' && error instanceof DOMException)
            ? error
            : undefined;
        _this = _super.call(this, domError, "Option \"" + option + "\" invalid with reason: \"" + reason + "\".") || this;
        _this.option = option;
        _this.reason = reason;
        _this.error = error;
        _this.name = 'InvalidOptionError';
        return _this;
    }
    return InvalidOptionError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidOptionError = InvalidOptionError;

},{"./DiagnosticError":7}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 * Error that is thrown when there are invalid options passed to a test.
 */
var InvalidOptionsError = /** @class */ (function (_super) {
    __extends(InvalidOptionsError, _super);
    function InvalidOptionsError(reasons) {
        var _this = _super.call(this, undefined, 'Some of the options passed to this test were unable to be validated.') || this;
        _this.reasons = {};
        _this.reasons = reasons;
        _this.name = 'InvalidOptionsError';
        return _this;
    }
    return InvalidOptionsError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidOptionsError = InvalidOptionsError;

},{"./DiagnosticError":7}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 * Represents when a test in the Diagnostics SDK is an unknown or unexpected
 * state, usually resulting in fatal error.
 */
var InvalidStateError = /** @class */ (function (_super) {
    __extends(InvalidStateError, _super);
    /**
     * Sets the name to `InvalidStateError`.
     * @param message
     */
    function InvalidStateError(message) {
        var _this = _super.call(this, undefined, message) || this;
        _this.name = 'InvalidStateError';
        return _this;
    }
    return InvalidStateError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidStateError = InvalidStateError;

},{"./DiagnosticError":7}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internalapi
 * Error that is thrown by the utility `waitForPromise`.
 */
var PromiseTimedOutError = /** @class */ (function (_super) {
    __extends(PromiseTimedOutError, _super);
    function PromiseTimedOutError() {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, PromiseTimedOutError.prototype);
        return _this;
    }
    return PromiseTimedOutError;
}(Error));
exports.PromiseTimedOutError = PromiseTimedOutError;

},{}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 */
var UnsupportedError = /** @class */ (function (_super) {
    __extends(UnsupportedError, _super);
    function UnsupportedError(message) {
        var _this = _super.call(this, undefined, message) || this;
        _this.name = 'UnsupportedError';
        return _this;
    }
    return UnsupportedError;
}(DiagnosticError_1.DiagnosticError));
exports.UnsupportedError = UnsupportedError;

},{"./DiagnosticError":7}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AlreadyStoppedError_1 = require("./AlreadyStoppedError");
exports.AlreadyStoppedError = AlreadyStoppedError_1.AlreadyStoppedError;
var DiagnosticError_1 = require("./DiagnosticError");
exports.DiagnosticError = DiagnosticError_1.DiagnosticError;
var InvalidStateError_1 = require("./InvalidStateError");
exports.InvalidStateError = InvalidStateError_1.InvalidStateError;
var PromiseTimedOutError_1 = require("./PromiseTimedOutError");
exports.PromiseTimedOutError = PromiseTimedOutError_1.PromiseTimedOutError;
var UnsupportedError_1 = require("./UnsupportedError");
exports.UnsupportedError = UnsupportedError_1.UnsupportedError;
var InvalidOptionError_1 = require("./InvalidOptionError");
exports.InvalidOptionError = InvalidOptionError_1.InvalidOptionError;
var InvalidOptionsError_1 = require("./InvalidOptionsError");
exports.InvalidOptionsError = InvalidOptionsError_1.InvalidOptionsError;

},{"./AlreadyStoppedError":6,"./DiagnosticError":7,"./InvalidOptionError":8,"./InvalidOptionsError":9,"./InvalidStateError":10,"./PromiseTimedOutError":11,"./UnsupportedError":12}],14:[function(require,module,exports){
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

},{"../errors":13}],15:[function(require,module,exports){
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

},{"../errors":13}],16:[function(require,module,exports){
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

},{"../errors":13}],17:[function(require,module,exports){
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

},{"../errors":13}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Audio_1 = require("./Audio");
exports.Audio = Audio_1.AudioPolyfill;
exports.AudioUnsupportedError = Audio_1.AudioUnsupportedError;
var AudioContext_1 = require("./AudioContext");
exports.AudioContext = AudioContext_1.AudioContextPolyfill;
exports.AudioContextUnsupportedError = AudioContext_1.AudioContextUnsupportedError;
var enumerateDevices_1 = require("./enumerateDevices");
exports.enumerateDevices = enumerateDevices_1.enumerateDevicesPolyfill;
exports.enumerateDevicesUnsupportedMessage = enumerateDevices_1.enumerateDevicesUnsupportedMessage;
exports.EnumerateDevicesUnsupportedError = enumerateDevices_1.EnumerateDevicesUnsupportedError;
exports.getDefaultDevices = enumerateDevices_1.getDefaultDevices;
var getUserMedia_1 = require("./getUserMedia");
exports.getUserMedia = getUserMedia_1.getUserMediaPolyfill;
exports.GetUserMediaUnsupportedError = getUserMedia_1.GetUserMediaUnsupportedError;

},{"./Audio":14,"./AudioContext":15,"./enumerateDevices":16,"./getUserMedia":17}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
/**
 * @internalapi
 * Determine whether audio is silent or not by analyzing an array of volume values.
 * @param volumes An array of volume values to to analyze.
 * @returns Whether audio is silent or not.
 */
function detectSilence(volumes) {
    // TODO Come up with a better algorithm for deciding if the volume values
    // resulting in a success
    // Loops over every sample, checks to see if it was completely silent by
    // checking if the average of the amplitudes is 0, and returns whether or
    // not more than 50% of the samples were silent.
    return !(volumes && volumes.length > 3 &&
        (volumes.filter(function (v) { return v > 0; }).length / volumes.length) > 0.5);
}
exports.detectSilence = detectSilence;
/**
 * @internalapi
 * Reject a promise after a specified timeout
 * @param promiseOrArray The promise to timeout.
 * @param timeoutMs The amount of time after which to reject the promise.
 */
function waitForPromise(promise, timeoutMs) {
    var timer;
    var timeoutPromise = new Promise(function (_, reject) {
        timer = setTimeout(function () { return reject(new errors_1.PromiseTimedOutError()); }, timeoutMs);
    });
    return Promise.race([
        promise,
        timeoutPromise,
    ]).finally(function () {
        clearTimeout(timer);
    });
}
exports.waitForPromise = waitForPromise;

},{"../errors":13}],20:[function(require,module,exports){
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var polyfills_1 = require("../polyfills");
/**
 * @internalapi
 * Return a function that validates an audio device by ID. It will returns a
 * `string` representing why the ID is invalid, or nothing if it is valid. Will
 * throw if `enumerateDevices` is not supported by the system.
 * @param options Options to pass to the validator. A mock `enumerateDevices`
 * may be passed here, as well as a `kind` may be passed here if there is a
 * desire to check the `kind` of audio device.
 * @returns A function that takes a `string` representing the audio device ID to
 * be validated and returns a Promise resolving a `string` representing the
 * invalid message or `undefined` if the audio device is valid.
 */
function createAudioDeviceValidator(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var opts = __assign({ enumerateDevices: polyfills_1.enumerateDevices }, options);
    /**
     * The audio device validator that will be returned.
     * @param deviceId The device ID to be validated.
     * @returns A Promise that resolves with a `string` representing why the
     * device ID is invalid, or `undefined` if it is valid.
     */
    return function (deviceId) { return __awaiter(_this, void 0, void 0, function () {
        var devices, _a, matchingDevicesKind, matchingDevicesId, matchingDevicesIdAndKind;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = opts.enumerateDevices;
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, opts.enumerateDevices()];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    devices = _a;
                    if (!devices) {
                        throw polyfills_1.EnumerateDevicesUnsupportedError;
                    }
                    if (!devices.length) {
                        return [2 /*return*/, 'No audio devices available.'];
                    }
                    // `deviceId` as `undefined` is a valid value as this will cause
                    // `getUserMedia` to just get the default device
                    if (deviceId === undefined) {
                        if (opts.kind) {
                            matchingDevicesKind = devices.filter(function (device) {
                                return device.kind === opts.kind;
                            });
                            if (!matchingDevicesKind.length) {
                                return [2 /*return*/, "No devices found with the correct kind \"" + opts.kind + "\"."];
                            }
                        }
                        return [2 /*return*/];
                    }
                    matchingDevicesId = devices.filter(function (device) {
                        return device.deviceId === deviceId;
                    });
                    if (!matchingDevicesId.length) {
                        return [2 /*return*/, "Device ID \"" + deviceId + "\" not found within list of available devices."];
                    }
                    if (opts.kind) {
                        matchingDevicesIdAndKind = matchingDevicesId.filter(function (device) { return device.kind === opts.kind; });
                        if (!matchingDevicesIdAndKind.length) {
                            return [2 /*return*/, "Device ID \"" + deviceId + "\" is not the correct \"kind\","
                                    + (" expected \"" + opts.kind + "\".")];
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
}
exports.createAudioDeviceValidator = createAudioDeviceValidator;
/**
 * @internalapi
 * Validate that an option is a valid device ID to pass to `getUserMedia` or
 * `setSinkId`.
 * @param option The option to check is a valid device ID to pass to
 * `getUserMedia` or `setSinkId`.
 * @returns If the option is not valid, return a string that describes why,
 * otherwise `undefined`.
 */
function validateDeviceId(option) {
    if (option && typeof option !== 'string') {
        return 'If "deviceId" is defined, it must be a "string".';
    }
}
exports.validateDeviceId = validateDeviceId;
/**
 * @internalapi
 * Validate that an option is a valid string.
 * @param option The option to check is a valid string.
 * @returns If the option is not valid, return a string that describes why it is
 * invalid, otherwise return `undefined`.
 */
function validateString(option) {
    var type = typeof option;
    if (type !== 'string') {
        return "Option cannot have type \"" + type + "\", must be \"string\".";
    }
}
exports.validateString = validateString;
/**
 * @internalapi
 * Validate a time-based parameter, i.e. duration or interval.
 * @param option The duration of time to validate
 * @returns A possibly undefined string, if the time is valid it will return
 * undefined, otherwise an error message
 */
function validateTime(option) {
    var doesNotExistMessage = validateExists(option);
    if (doesNotExistMessage) {
        return doesNotExistMessage;
    }
    if (typeof option !== 'number') {
        return 'Time must be a number.';
    }
    if (option < 0) {
        return 'Time must always be non-negative.';
    }
}
exports.validateTime = validateTime;
/**
 * @internalapi
 * Validate that an option is neither `undefined` nor `null`.
 * @param option The option to check exists.
 * @returns A possibly undefined string, if the option exists it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
function validateExists(option) {
    if (option === undefined || option === null) {
        return "Option cannot be \"" + String(option) + "\".";
    }
}
exports.validateExists = validateExists;
/**
 * @internalapi
 * Validate input options to the [[InputTest]].
 * @param inputOptions The options to validate.
 * @param config A record of option names to either a single
 * [[ValidatorFunction]] or an array of [[ValidatorFunctions]].
 * @returns A Promise that resolves either with a [[InvalidityRecord]] describing
 * which options are invalid and why, or `undefined` if all options are vaild.
 */
function validateOptions(inputOptions, config) {
    return __awaiter(this, void 0, void 0, function () {
        var validity;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validity = {};
                    return [4 /*yield*/, Promise.all(Object.entries(config).map(function (_a) {
                            var optionKey = _a[0], validatorFunctions = _a[1];
                            return __awaiter(_this, void 0, void 0, function () {
                                var optionValue, validators;
                                var _this = this;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!validatorFunctions) {
                                                return [2 /*return*/];
                                            }
                                            optionValue = inputOptions[optionKey];
                                            validators = Array.isArray(validatorFunctions)
                                                ? validatorFunctions
                                                : [validatorFunctions];
                                            return [4 /*yield*/, Promise.all(validators.map(function (validator) { return __awaiter(_this, void 0, void 0, function () {
                                                    var invalidReason, invalidReasons;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, validator(optionValue)];
                                                            case 1:
                                                                invalidReason = _a.sent();
                                                                if (invalidReason) {
                                                                    invalidReasons = validity[optionKey];
                                                                    if (invalidReasons) {
                                                                        invalidReasons.push(invalidReason);
                                                                    }
                                                                    else {
                                                                        validity[optionKey] = [invalidReason];
                                                                    }
                                                                }
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }))];
                                        case 1:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }))];
                case 1:
                    _a.sent();
                    if (Object.keys(validity).length) {
                        return [2 /*return*/, validity];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.validateOptions = validateOptions;

},{"../polyfills":18}],21:[function(require,module,exports){
module.exports={
    "name": "@twilio/rtc-diagnostics",
    "version": "1.0.0-rc2",
    "description": "Various diagnostics functions to help analyze connections to Twilio",
    "main": "./es5/lib/diagnostics.js",
    "types": "./es5/lib/diagnostics.d.ts",
    "scripts": {
        "build": "npm-run-all clean docs build:es5 build:dist build:dist-min",
        "build:dist": "rimraf ./dist && node ./scripts/build.js ./LICENSE.md ./dist/rtc-diagnostics.js",
        "build:dist-min": "uglifyjs ./dist/rtc-diagnostics.js -o ./dist/rtc-diagnostics.min.js --comments \"/^! rtc-diagnostics.js/\" -b beautify=false,ascii_only=true",
        "build:es5": "rimraf ./es5 && tsc",
        "build:release": "npm-run-all lint build status",
        "clean": "rimraf ./dist ./coverage ./es5 ./docs",
        "docs": "rimraf ./docs && typedoc --internal-aliases internal,publicapi --external-aliases external,internalapi --excludePrivate --excludeProtected --theme ./node_modules/typedoc-twilio-theme/bin/default",
        "lint": "tslint -c ./tslint.json --project ./tsconfig.json -t stylish",
        "release": "release",
        "status": "git status",
        "test": "npm-run-all lint build test:unit test:integration",
        "test:unit": "nyc mocha -r ts-node/register ./tests/unit/index.ts",
        "test:integration": "karma start"
    },
    "contributors": [
        "Michael Huynh",
        "Ryan Rowland",
        "Charlie Santos"
    ],
    "license": "Apache-2.0",
    "keywords": [
        "client",
        "diagnostics",
        "twilio",
        "video",
        "voice",
        "voip"
    ],
    "private": true,
    "dependencies": {
        "@types/events": "3.0.0",
        "@types/node": "12.12.11",
        "events": "3.0.0"
    },
    "devDependencies": {
        "@types/mocha": "5.2.7",
        "@types/sinon": "7.5.1",
        "browserify": "16.5.0",
        "coverage": "0.4.1",
        "is-docker": "2.0.0",
        "karma": "4.4.1",
        "karma-chrome-launcher": "3.1.0",
        "karma-firefox-launcher": "1.2.0",
        "karma-mocha": "1.3.0",
        "karma-spec-reporter": "0.0.32",
        "karma-typescript": "4.1.1",
        "mocha": "6.2.2",
        "npm-run-all": "4.1.5",
        "nyc": "15.0.0",
        "release-tool": "git://github.com/twilio/release-tool#8860ca9",
        "sinon": "7.5.0",
        "travis-multirunner": "4.6.0",
        "ts-node": "8.5.2",
        "tsify": "4.0.1",
        "tslint": "5.20.1",
        "twilio": "3.39.1",
        "typedoc": "0.16.11",
        "typedoc-plugin-as-member-of": "1.0.2",
        "typedoc-plugin-external-module-name": "3.0.0",
        "typedoc-plugin-internal-external": "2.1.1",
        "typedoc-twilio-theme": "github:charliesantos/typedoc-twilio-theme#1.0.1",
        "typescript": "3.7.2",
        "vinyl-fs": "3.0.3",
        "vinyl-source-stream": "2.0.0"
    }
}

},{}],22:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}]},{},[5]);
