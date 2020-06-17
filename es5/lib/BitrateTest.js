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
//# sourceMappingURL=BitrateTest.js.map