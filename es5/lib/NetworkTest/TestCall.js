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
var utils_1 = require("../utils");
/**
 * Creates two PeerConnections that attempt to connect to each other through
 * any ICE servers given by the parameter
 * [[TestCall.Options.peerConnectionConfig]].
 * Provides a `send` helper function to send data from the `sender` to the
 * `receiver`.
 * @private
 */
var TestCall = /** @class */ (function (_super) {
    __extends(TestCall, _super);
    /**
     * Constructor for the [[TestCall]] helper class. Creates the two
     * `RTCPeerConnection`s and maintains their connection to each other.
     */
    function TestCall(config) {
        var _this = _super.call(this) || this;
        /**
         * Network event time measurements.
         */
        _this._networkTiming = {};
        _this._timeoutDuration = config.timeoutDuration;
        var peerConnectionFactory = config.peerConnectionFactory || RTCPeerConnection;
        _this._sender = new peerConnectionFactory(config.peerConnectionConfig);
        _this._recipient = new peerConnectionFactory(config.peerConnectionConfig);
        // Set up data channels and listeners on the recipient and the sender.
        _this._recipient.ondatachannel = function (_a) {
            var channel = _a.channel;
            channel.onmessage = function (messageEvent) {
                _this.emit(TestCall.Event.Message, messageEvent);
            };
            channel.onopen = function (event) {
                _this.emit(TestCall.Event.Open, _this._recipient, event);
            };
            channel.onclose = function (event) {
                _this.emit(TestCall.Event.Close, _this._recipient, event);
            };
        };
        _this._sendDataChannel = _this._sender.createDataChannel('sendDataChannel');
        _this._sendDataChannel.onopen = function (event) {
            _this.emit(TestCall.Event.Open, _this._sender, event);
        };
        _this._sendDataChannel.onclose = function (event) {
            _this.emit(TestCall.Event.Close, _this._sender, event);
        };
        // Forward ICE candidates
        _this._bindPeerConnectionIceCandidateHandler(_this._sender, _this._recipient);
        _this._bindPeerConnectionIceCandidateHandler(_this._recipient, _this._sender);
        _this._bindPeerConnectionTimeHandlers(_this._sender);
        return _this;
    }
    /**
     * Close the `sender` and `recipient` PCs.
     */
    TestCall.prototype.close = function () {
        if (this._sender) {
            this._sender.close();
        }
        if (this._recipient) {
            this._recipient.close();
        }
    };
    /**
     * Create offers and answers for the PCs and set them. This starts the
     * ICE connection process between the two.
     */
    TestCall.prototype.establishConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var waitForDataChannelOpen, senderDesc, recipientDesc;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        waitForDataChannelOpen = [
                            this._sender,
                            this._recipient,
                        ].map(function (peerConnection) { return new Promise(function (resolve) {
                            _this.on(TestCall.Event.Open, function (connectedPeerConnection) {
                                if (peerConnection === connectedPeerConnection) {
                                    resolve();
                                }
                            });
                        }); });
                        return [4 /*yield*/, this._sender.createOffer()];
                    case 1:
                        senderDesc = _a.sent();
                        return [4 /*yield*/, Promise.all([
                                // Set this description for the local and remote legs
                                this._sender.setLocalDescription(senderDesc),
                                this._recipient.setRemoteDescription(senderDesc),
                            ])];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this._recipient.createAnswer()];
                    case 3:
                        recipientDesc = _a.sent();
                        return [4 /*yield*/, Promise.all([
                                // Set this description for the local and remote legs
                                this._recipient.setLocalDescription(recipientDesc),
                                this._sender.setRemoteDescription(recipientDesc),
                            ])];
                    case 4:
                        _a.sent();
                        // Once the offer and answer are set, the connection should start and
                        // eventually be established between the two PCs
                        // We can wait for the data channel to open on both sides to be sure
                        return [4 /*yield*/, Promise.all(waitForDataChannelOpen.map(function (promise) {
                                return utils_1.waitForPromise(promise, _this._timeoutDuration);
                            }))];
                    case 5:
                        // Once the offer and answer are set, the connection should start and
                        // eventually be established between the two PCs
                        // We can wait for the data channel to open on both sides to be sure
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns all recorded network time measurements.
     */
    TestCall.prototype.getNetworkTiming = function () {
        return this._networkTiming;
    };
    /**
     * Helper function for sending data
     * @param data a string of characters that will be sent from one end of the
     * [[TestCall]] to the other, specifically from [[TestCall._sender]] to
     * [[TestCall._recipient]].
     */
    TestCall.prototype.send = function (data) {
        this._sendDataChannel.send(data);
    };
    /**
     * Bind the ice candidate handler to the peer connection.
     * @param peerConnectionFrom The peer connection to bind the ice candidate
     * handler to.
     * @param peerConnectionTo The peer connection to forward the ice candidate
     * to.
     */
    TestCall.prototype._bindPeerConnectionIceCandidateHandler = function (peerConnectionFrom, peerConnectionTo) {
        var _this = this;
        peerConnectionFrom.onicecandidate = function (iceEvent) {
            if (iceEvent.candidate &&
                iceEvent.candidate.candidate &&
                iceEvent.candidate.candidate.indexOf('relay') !== -1) {
                _this.emit(TestCall.Event.IceCandidate, peerConnectionFrom, iceEvent);
                peerConnectionTo.addIceCandidate(iceEvent.candidate);
            }
        };
    };
    /**
     * Bind time measuring event handlers.
     * @param peerConnection The peer connection to bind the time measuring
     * event handlers to.
     */
    TestCall.prototype._bindPeerConnectionTimeHandlers = function (peerConnection) {
        var _this = this;
        peerConnection.onconnectionstatechange = function () {
            _this._networkTiming.peerConnection =
                _this._networkTiming.peerConnection || { start: 0 };
            switch (peerConnection.connectionState) {
                case 'connecting':
                    _this._networkTiming.peerConnection.start = Date.now();
                    break;
                case 'connected':
                    _this._networkTiming.peerConnection.end = Date.now();
                    _this._networkTiming.peerConnection.duration =
                        _this._networkTiming.peerConnection.end -
                            _this._networkTiming.peerConnection.start;
                    break;
            }
        };
        peerConnection.oniceconnectionstatechange = function () {
            _this._networkTiming.ice = _this._networkTiming.ice || { start: 0 };
            switch (peerConnection.iceConnectionState) {
                case 'checking':
                    _this._networkTiming.ice.start = Date.now();
                    break;
                case 'connected':
                    _this._networkTiming.ice.end = Date.now();
                    _this._networkTiming.ice.duration =
                        _this._networkTiming.ice.end - _this._networkTiming.ice.start;
                    break;
            }
        };
    };
    return TestCall;
}(events_1.EventEmitter));
exports.TestCall = TestCall;
(function (TestCall) {
    /**
     * Events that the [[TestCall]] helper class may emit as the `PeerConnection`s
     * communicate with each other.
     */
    var Event;
    (function (Event) {
        Event["Close"] = "close";
        Event["IceCandidate"] = "iceCandidate";
        Event["Message"] = "message";
        Event["Open"] = "open";
    })(Event = TestCall.Event || (TestCall.Event = {}));
    /**
     * Used in conjunction with the events raised from this class to determine
     * which leg of the call is connected.
     * For example, the [[TestCall.Events.Open]] event is raised with the information
     * `Recipient` or `Sender` signifying which side of the data channel was just
     * opened.
     */
    var CallId;
    (function (CallId) {
        CallId["Recipient"] = "recipient";
        CallId["Sender"] = "sender";
    })(CallId = TestCall.CallId || (TestCall.CallId = {}));
})(TestCall = exports.TestCall || (exports.TestCall = {}));
exports.TestCall = TestCall;
//# sourceMappingURL=TestCall.js.map