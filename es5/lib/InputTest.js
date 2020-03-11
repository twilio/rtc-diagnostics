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
var enumerateDevices_1 = require("./polyfills/enumerateDevices");
var utils_1 = require("./utils");
var optionValidation_1 = require("./utils/optionValidation");
/**
 * Supervises an input device test utilizing a `MediaStream` passed to it, or an
 * input `MediaStream` obtained from `getUserMedia` if no `MediaStream` was
 * passed via `options`.
 * The events defined in the enum [[Events]] are emitted as the test
 * runs.
 */
var InputTest = /** @class */ (function (_super) {
    __extends(InputTest, _super);
    /**
     * Initializes the `startTime` and `options`.
     * @param deviceIdOrTrack
     * @param options
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
        this.emit(InputTest.Events.End, didPass, report);
        return report;
    };
    Object.defineProperty(InputTest.prototype, "maxVolume", {
        /**
         * The maximum volume detected during the test.
         */
        get: function () {
            return this._maxValue;
        },
        enumerable: true,
        configurable: true
    });
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
     * Called every `InputTest._options.pollingRate` ms, emits the volume passed
     * to it as a `Events.Volume` event.
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
            var invalidReasons, _a, _b, analyser_1, microphone_1, frequencyDataBytes_1, volumeEvent_1, error_1;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, optionValidation_1.validateOptions(this._options, {
                                deviceId: optionValidation_1.validateDeviceId,
                                duration: optionValidation_1.validateTime,
                                pollIntervalMs: optionValidation_1.validateTime,
                            })];
                    case 1:
                        invalidReasons = _c.sent();
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
                        _a._mediaStream = _c.sent();
                        _b = this;
                        return [4 /*yield*/, enumerateDevices_1.getDefaultDevices()];
                    case 3:
                        _b._defaultDevices = _c.sent();
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
                                _this._volumeTimeout = setTimeout(volumeEvent_1, _this._options.pollIntervalMs);
                            }
                        };
                        this._volumeTimeout = setTimeout(volumeEvent_1, this._options.pollIntervalMs);
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _c.sent();
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
        pollIntervalMs: 100,
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
 * Test an audio input device and measures the volume.
 * @param options
 */
function testInputDevice(options) {
    return new InputTest(options);
}
exports.testInputDevice = testInputDevice;
//# sourceMappingURL=InputTest.js.map