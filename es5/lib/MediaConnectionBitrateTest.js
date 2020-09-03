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
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var constants_1 = require("./constants");
var DiagnosticError_1 = require("./errors/DiagnosticError");
var candidate_1 = require("./utils/candidate");
/**
 * MediaConnectionBitrateTest uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * connected via a [Twilio Network Traversal Service](https://www.twilio.com/docs/stun-turn).
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 * See [[MediaConnectionBitrateTest.Options.iceServers]] for information how to use Twilio NTS.
 */
var MediaConnectionBitrateTest = /** @class */ (function (_super) {
    __extends(MediaConnectionBitrateTest, _super);
    /**
     * Construct a [[MediaConnectionBitrateTest]] instance. The test will start immediately.
     * Test should be allowed to run for a minimum of 8 seconds. To stop the test, call [[MediaConnectionBitrateTest.stop]].
     * @constructor
     * @param options
     */
    function MediaConnectionBitrateTest(options) {
        var _this = _super.call(this) || this;
        /**
         * Active warnings to keep track of.
         */
        _this.activeWarnings = new Set();
        /**
         * A timestamp of when the test ends.
         */
        _this._endTime = null;
        /**
         * Errors detected during the test
         */
        _this._errors = [];
        /**
         * An array of WebRTC stats for the ICE candidates gathered when connecting to media.
         */
        _this._iceCandidateStats = [];
        /**
         * Number of bytes received the last time it was checked
         */
        _this._lastBytesChecked = 0;
        /**
         * Last timestamp when the bytes received was checked
         */
        _this._lastCheckedTimestamp = 0;
        /**
         * Total number of bytes received by the receiver RTCPeerConnection
         */
        _this._totalBytesReceived = 0;
        /**
         * Bitrate (kbps) values collected during the test
         */
        _this._values = [];
        _this._options = __assign({}, options);
        var iceServers = _this._options.iceServers;
        _this._pcReceiver = new RTCPeerConnection({ iceServers: iceServers, iceTransportPolicy: 'relay' });
        _this._pcSender = new RTCPeerConnection({ iceServers: iceServers });
        _this._pcReceiver.onicecandidate = function (event) { return _this._onIceCandidate(_this._pcSender, event); };
        _this._pcSender.onicecandidate = function (event) { return _this._onIceCandidate(_this._pcReceiver, event); };
        _this._setupNetworkListeners(_this._pcSender);
        _this._startTime = Date.now();
        // Return before starting the test to allow consumer
        // to listen and capture errors
        setTimeout(function () {
            _this._setupDataChannel();
            _this._startTest();
        });
        _this._timeout = setTimeout(function () {
            _this._onError("Network timeout; exceeded limit of " + constants_1.BITRATE_TEST_TIMEOUT_MS + "ms");
        }, constants_1.BITRATE_TEST_TIMEOUT_MS);
        return _this;
    }
    /**
     * Stops the current test.
     */
    MediaConnectionBitrateTest.prototype.stop = function () {
        clearTimeout(this._timeout);
        clearInterval(this._sendDataIntervalId);
        clearInterval(this._checkBitrateIntervalId);
        if (typeof this._endTime !== 'number' || this._endTime === 0) {
            this._pcSender.close();
            this._pcReceiver.close();
            this._endTime = Date.now();
            this.emit(MediaConnectionBitrateTest.Events.End, this._getReport());
        }
    };
    /**
     * Calculate bitrate by comparing bytes received between current time and the last time it was checked
     */
    MediaConnectionBitrateTest.prototype._checkBitrate = function () {
        // No data yet
        if (!this._lastCheckedTimestamp || !this._lastBytesChecked) {
            this._lastCheckedTimestamp = Date.now();
            this._lastBytesChecked = this._totalBytesReceived;
            return;
        }
        // Calculate bitrate in kbps
        var now = Date.now();
        var bitrate = 8 * (this._totalBytesReceived - this._lastBytesChecked) / (now - this._lastCheckedTimestamp);
        if (bitrate > 0) {
            clearTimeout(this._timeout);
        }
        this._lastCheckedTimestamp = now;
        this._lastBytesChecked = this._totalBytesReceived;
        this._values.push(bitrate);
        this.emit(MediaConnectionBitrateTest.Events.Bitrate, bitrate);
        this._maybeEmitWarning();
    };
    /**
     * Generate and returns the report for this test
     */
    MediaConnectionBitrateTest.prototype._getReport = function () {
        var averageBitrate = this._values
            .reduce(function (total, value) { return total += value; }, 0) / this._values.length;
        averageBitrate = isNaN(averageBitrate) ? 0 : averageBitrate;
        var testTiming = { start: this._startTime };
        if (this._endTime) {
            testTiming.end = this._endTime;
            testTiming.duration = this._endTime - this._startTime;
        }
        var report = {
            averageBitrate: averageBitrate,
            errors: this._errors,
            iceCandidateStats: this._iceCandidateStats,
            testName: MediaConnectionBitrateTest.testName,
            testTiming: testTiming,
            values: this._values,
        };
        if (this._selectedIceCandidatePairStats) {
            report.selectedIceCandidatePairStats = this._selectedIceCandidatePairStats;
        }
        return report;
    };
    /**
     * Check current bitrate values and emit warnings
     * if [[WarningName.LowBitrate]] criteria are met.
     */
    MediaConnectionBitrateTest.prototype._maybeEmitWarning = function () {
        var _this = this;
        if (this._values.length < constants_1.MIN_BITRATE_SAMPLE_COUNT) {
            return;
        }
        if (this._values
            .slice(this._values.length - constants_1.MIN_BITRATE_SAMPLE_COUNT)
            .filter(function (bitrate) { var _a; return bitrate < (_a = _this._options.minBitrateThreshold, (_a !== null && _a !== void 0 ? _a : constants_1.MIN_BITRATE_THRESHOLD)); })
            .length > constants_1.MIN_BITRATE_FAIL_COUNT) {
            if (!this.activeWarnings.has(constants_1.WarningName.LowBitrate)) {
                this.activeWarnings.add(constants_1.WarningName.LowBitrate);
                this.emit(MediaConnectionBitrateTest.Events.Warning, constants_1.WarningName.LowBitrate);
            }
        }
        else if (this.activeWarnings.has(constants_1.WarningName.LowBitrate)) {
            this.activeWarnings.delete(constants_1.WarningName.LowBitrate);
            this.emit(MediaConnectionBitrateTest.Events.WarningCleared, constants_1.WarningName.LowBitrate);
        }
    };
    /**
     * Called when an error is detected
     * @param message - Message that describes the error
     * @param error - The error object
     * @param isFatal - Whether this is a fatal error
     */
    MediaConnectionBitrateTest.prototype._onError = function (message, error) {
        var diagnosticError = new DiagnosticError_1.DiagnosticError(error, message);
        this._errors.push(diagnosticError);
        this.emit(MediaConnectionBitrateTest.Events.Error, diagnosticError);
        this.stop();
    };
    /**
     * Called when a local candidate is gathered
     * @param remotePc - The remote RTCPeerConnection
     */
    MediaConnectionBitrateTest.prototype._onIceCandidate = function (remotePc, event) {
        var _this = this;
        if (event.candidate) {
            remotePc.addIceCandidate(event.candidate)
                .catch(function (error) { return _this._onError('Unable to add candidate', error); });
        }
    };
    /**
     * Called when a message is received
     * @param event
     */
    MediaConnectionBitrateTest.prototype._onMessageReceived = function (event) {
        this._totalBytesReceived += event.data.length;
    };
    /**
     * Called when an answer is created by the receiver
     * @param answer - The answer session description created by the receiver RTCPeerConnection
     */
    MediaConnectionBitrateTest.prototype._onReceiverAnswerCreated = function (answer) {
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
    MediaConnectionBitrateTest.prototype._onSenderOfferCreated = function (offer) {
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
    MediaConnectionBitrateTest.prototype._sendData = function () {
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
    MediaConnectionBitrateTest.prototype._setupDataChannel = function () {
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
    MediaConnectionBitrateTest.prototype._setupNetworkListeners = function (pc) {
        var _this = this;
        pc.oniceconnectionstatechange = function () {
            if (pc.iceConnectionState === 'connected') {
                (_this._options.getRTCIceCandidateStatsReport || candidate_1.getRTCIceCandidateStatsReport)(_this._pcSender)
                    .then(function (statsReport) {
                    _this._iceCandidateStats = statsReport.iceCandidateStats;
                    _this._selectedIceCandidatePairStats = statsReport.selectedIceCandidatePairStats;
                })
                    .catch(function (error) {
                    _this._onError('Unable to generate WebRTC stats report', error);
                });
            }
        };
    };
    /**
     * Starts the test.
     */
    MediaConnectionBitrateTest.prototype._startTest = function () {
        var _this = this;
        if (!this._options.iceServers) {
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
    MediaConnectionBitrateTest.testName = 'media-connection-bitrate-test';
    return MediaConnectionBitrateTest;
}(events_1.EventEmitter));
exports.MediaConnectionBitrateTest = MediaConnectionBitrateTest;
(function (MediaConnectionBitrateTest) {
    /**
     * Possible events that a [[MediaConnectionBitrateTest]] might emit. See [[MediaConnectionBitrateTest.on]].
     */
    var Events;
    (function (Events) {
        Events["Bitrate"] = "bitrate";
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Warning"] = "warning";
        Events["WarningCleared"] = "warning-cleared";
    })(Events = MediaConnectionBitrateTest.Events || (MediaConnectionBitrateTest.Events = {}));
})(MediaConnectionBitrateTest = exports.MediaConnectionBitrateTest || (exports.MediaConnectionBitrateTest = {}));
exports.MediaConnectionBitrateTest = MediaConnectionBitrateTest;
/**
 * The test uses two [RTCPeerConnections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) connected via a Twilio TURN server.
 * Using [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), one RTCPeerConnection will saturate the data channel buffer and will
 * constantly send data packets to the other RTCPeerConnection. The receiving peer will measure the bitrate base on the amount of packets received every second.
 *
 * Example:
 * ```ts
 *   import { testMediaConnectionBitrate } from '@twilio/rtc-diagnostics';
 *
 *   const mediaConnectionBitrateTest = testMediaConnectionBitrate({
 *     iceServers: [{
 *       urls: 'stun:global.stun.twilio.com:3478?transport=udp',
 *     }, {
 *       credential: 'bar',
 *       username: 'foo',
 *       urls: 'turn:global.turn.twilio.com:3478?transport=udp',
 *     }],
 *   });
 *
 *   mediaConnectionBitrateTest.on('bitrate', (bitrate) => {
 *     console.log(bitrate);
 *   });
 *
 *   mediaConnectionBitrateTest.on('error', (error) => {
 *     console.log(error);
 *   });
 *
 *   mediaConnectionBitrateTest.on('end', (report) => {
 *     console.log(report);
 *   });
 *
 *   // Run the test for 15 seconds
 *   setTimeout(() => {
 *     mediaConnectionBitrateTest.stop();
 *   }, 15000);
 * ```
 * See [[MediaConnectionBitrateTest.Options.iceServers]] for details on how to obtain STUN and TURN server configurations.
 */
function testMediaConnectionBitrate(options) {
    return new MediaConnectionBitrateTest(options);
}
exports.testMediaConnectionBitrate = testMediaConnectionBitrate;
//# sourceMappingURL=MediaConnectionBitrateTest.js.map