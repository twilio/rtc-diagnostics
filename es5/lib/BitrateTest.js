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
 * Runs bitrate related tests while connected to a TURN server.
 * The events defined in the enum [[Events]] are emitted as the test runs.
 */
var BitrateTest = /** @class */ (function (_super) {
    __extends(BitrateTest, _super);
    /**
     * Construct a [[BitrateTest]] instance.
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
        return {
            averageBitrate: isNaN(averageBitrate) ? 0 : averageBitrate,
            didPass: !this._errors.length && !!this._values.length,
            errors: this._errors,
            networkTiming: this._networkTiming,
            testName: BitrateTest.testName,
            testTiming: this._testTiming,
            values: this._values,
        };
    };
    /**
     * Called when an error is detected
     * @param message - Message that describes the error
     * @param error - The error object
     * @param isFatal - Whether this is a fatal error
     */
    BitrateTest.prototype._onError = function (message, error, isFatal) {
        var diagnosticError = new DiagnosticError_1.DiagnosticError(error, message);
        this._errors.push(diagnosticError);
        this.emit(BitrateTest.Events.Error, diagnosticError);
        if (isFatal) {
            this.stop();
        }
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
            return _this._onError('Unable to set local or remote description from createAnswer', error, true);
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
            return _this._onError('Unable to set local or remote description from createOffer', error, true);
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
            this._onError('Error creating data channel', e, true);
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
                _this._networkTiming.peerConnection.duration = end - start;
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
                _this._networkTiming.ice.duration = end - start;
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
            return this._onError('No iceServers found', undefined, true);
        }
        this._pcSender.createOffer()
            .then(function (offer) { return _this._onSenderOfferCreated(offer); })
            .then(function () {
            return _this._pcReceiver.createAnswer()
                .then(function (answer) { return _this._onReceiverAnswerCreated(answer); })
                .catch(function (error) { return _this._onError('Unable to create answer', error, true); });
        }).catch(function (error) { return _this._onError('Unable to create offer', error, true); });
    };
    /**
     * Name of this test
     */
    BitrateTest.testName = 'bitrate-test';
    return BitrateTest;
}(events_1.EventEmitter));
exports.BitrateTest = BitrateTest;
(function (BitrateTest) {
    /**
     * Possible events that a [[BitrateTest]] might emit. See [[BitrateTest.on]].
     */
    var Events;
    (function (Events) {
        Events["Bitrate"] = "bitrate";
        Events["End"] = "end";
        Events["Error"] = "error";
    })(Events = BitrateTest.Events || (BitrateTest.Events = {}));
})(BitrateTest = exports.BitrateTest || (exports.BitrateTest = {}));
exports.BitrateTest = BitrateTest;
/**
 * Tests your bitrate while connected to a TURN server.
 */
function testBitrate(options) {
    return new BitrateTest(options);
}
exports.testBitrate = testBitrate;
//# sourceMappingURL=BitrateTest.js.map