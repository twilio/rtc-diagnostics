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
var errors_1 = require("./errors");
var polyfills_1 = require("./polyfills");
var optionValidation_1 = require("./utils/optionValidation");
/**
 * [[VideoInputTest]] class that parses options and starts a video input device
 * test.
 *
 * Please see [[testVideoInputDevice]] for details and recommended practices.
 */
var VideoInputTest = /** @class */ (function (_super) {
    __extends(VideoInputTest, _super);
    /**
     * Constructor for a [[VideoInputTest]] object.
     * @param options Options to be used during the runtime of the test.
     */
    function VideoInputTest(options) {
        var _this = _super.call(this) || this;
        /**
         * Timestamp of when the test was ended.
         */
        _this._endTime = null;
        /**
         * An array of any errors that occur during the run time of the test.
         */
        _this._errors = [];
        /**
         * The promise returned by the `HTMLMediaElement` after playing the stream
         * captured by `getUserMedia`.
         */
        _this._playPromise = null;
        /**
         * Timer ID of the test duration timeout.
         */
        _this._timeoutId = null;
        /**
         * The `MediaStream` resulting from calling `getUserMedia`.
         */
        _this._userMediaStream = null;
        _this._options = __assign(__assign({}, VideoInputTest.defaultOptions), options);
        /**
         * Use `setTimeout` to allow event listeners to properly bind before
         * starting the test.
         */
        setTimeout(function () { return _this._startTest(); });
        return _this;
    }
    /**
     * Stops the test. Emits a report upon the end of the test.
     */
    VideoInputTest.prototype.stop = function () {
        var _a;
        if (typeof this._endTime === 'number') {
            this._onWarning(new errors_1.AlreadyStoppedError());
            return;
        }
        this._endTime = Date.now();
        var _b = ((_a = this._userMediaStream) === null || _a === void 0 ? void 0 : _a.getVideoTracks()[0].getSettings()) || {}, streamWidth = _b.width, streamHeight = _b.height, deviceId = _b.deviceId;
        var report = {
            deviceId: deviceId,
            errors: this._errors,
            resolution: { width: streamWidth || 0, height: streamHeight || 0 },
            testName: VideoInputTest.testName,
        };
        if (this._startTime) {
            report.testTiming = {
                duration: this._endTime - this._startTime,
                end: this._endTime,
                start: this._startTime,
            };
        }
        this.emit(VideoInputTest.Events.End, report);
        this._cleanup();
    };
    /**
     * Clean up the test.
     */
    VideoInputTest.prototype._cleanup = function () {
        if (this._userMediaStream) {
            this._userMediaStream.getTracks().forEach(function (track) {
                track.stop();
            });
            this._userMediaStream = null;
            if (this._options.element) {
                var element_1 = this._options.element;
                var pausePromise = this._playPromise
                    ? this._playPromise.then(function () {
                        element_1.pause();
                    })
                    : Promise.resolve();
                pausePromise.finally(function () {
                    element_1.srcObject = null;
                    element_1.src = '';
                    element_1.load();
                });
            }
        }
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    };
    /**
     * Helper function that should be called when an error occurs, recoverable
     * or not.
     * @param error
     */
    VideoInputTest.prototype._onError = function (error) {
        this._errors.push(error);
        this.emit(VideoInputTest.Events.Error, error);
    };
    /**
     * Warning event handler.
     * @param warning
     */
    VideoInputTest.prototype._onWarning = function (error) {
        if (this._options.debug) {
            // tslint:disable-next-line no-console
            console.warn(error);
        }
    };
    /**
     * Entry point of the test.
     */
    VideoInputTest.prototype._startTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var invalidReasons, _a, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, optionValidation_1.validateOptions(this._options, {
                                deviceId: optionValidation_1.validateDeviceId,
                                duration: optionValidation_1.validateTime,
                            })];
                    case 1:
                        invalidReasons = _b.sent();
                        if (invalidReasons) {
                            throw new errors_1.InvalidOptionsError(invalidReasons);
                        }
                        if (!this._options.getUserMedia) {
                            throw polyfills_1.GetUserMediaUnsupportedError;
                        }
                        _a = this;
                        return [4 /*yield*/, this._options.getUserMedia({ video: __assign({ deviceId: this._options.deviceId }, this._options.resolution) })];
                    case 2:
                        _a._userMediaStream = _b.sent();
                        this._startTime = Date.now();
                        if (this._options.element) {
                            this._options.element.srcObject = this._userMediaStream;
                            this._playPromise = this._options.element.play();
                        }
                        if (this._options.duration && this._options.duration !== Infinity) {
                            this._timeoutId = setTimeout(function () { return _this.stop(); }, this._options.duration);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
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
                        this.stop();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * The name of the test.
     */
    VideoInputTest.testName = 'video-input-test';
    /**
     * Default options for the test.
     */
    VideoInputTest.defaultOptions = {
        debug: false,
        duration: Infinity,
        getUserMedia: polyfills_1.getUserMedia,
    };
    return VideoInputTest;
}(events_1.EventEmitter));
exports.VideoInputTest = VideoInputTest;
(function (VideoInputTest) {
    /**
     * Possible events that a [[VideoInputTest]] might emit. See [[VideoInputTest.on]].
     */
    var Events;
    (function (Events) {
        Events["End"] = "end";
        Events["Error"] = "error";
    })(Events = VideoInputTest.Events || (VideoInputTest.Events = {}));
})(VideoInputTest = exports.VideoInputTest || (exports.VideoInputTest = {}));
exports.VideoInputTest = VideoInputTest;
/**
 * This test examines video input capabilities. It serves to help diagnose
 * potential video device issues that would prevent video from being shared in
 * a WebRTC call.
 *
 * ---
 *
 * This test will use `getUserMedia` to try and capture a video stream from the
 * user. If this succeeds and an `HTMLMediaElement` is passed to the test within
 * the test options, then the stream will be bound to the element and should be
 * displayed.
 *
 * ---
 *
 * When the test ends, all of the tracks within the captured `MediaStream` are
 * ended and the `srcObject` of the `HTMLMediaElement` is set to `null`.
 */
function testVideoInputDevice(options) {
    return new VideoInputTest(options);
}
exports.testVideoInputDevice = testVideoInputDevice;
//# sourceMappingURL=VideoInputTest.js.map