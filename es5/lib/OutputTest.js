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
 * Supervises an output device test by playing a sound clip that is either the
 * ringing tone for the Client SDK, or defined by the member `testURI` in the
 * `options` parameter.
 *
 * If the data at `testURI` is unable to be loaded, meaning the error event is
 * raised on the audio element, then the test ends immediately with an error in
 * the report.
 *
 * If `doLoop` is set to `false`, then the test will run for either the option
 * `duration`, or the full duration of the audio file, which ever is shorter.
 * If `doLoop` is set to `true`, it will only run as long as the `duration`
 * option.
 * If the test times out (as defined by the `duration` in the `options`
 * paramater), then the test is considered passing or not by the `passOnTimeout`
 * option and ends.
 *
 * If the more than 50% of the volume levels are silent, then the test is considered failing.
 */
var OutputTest = /** @class */ (function (_super) {
    __extends(OutputTest, _super);
    /**
     * Sets up several things for the `OutputTest` to run later in the
     * `_startTest` function.
     * An `AudioContext` is created if none is passed in the `options` parameter
     * and the `_startTime` is immediately set.
     * @param options
     */
    function OutputTest(options) {
        var _this = _super.call(this) || this;
        /**
         * An `AudioContext` that is used to process the audio source.
         */
        _this._audioContext = null;
        /**
         * An `AudioElement` that is attached to the DOM to play audio.
         */
        _this._audioElement = null;
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
         * A Promise that resolves when the `AudioElement` successfully starts playing
         * audio. Will reject if not possible.
         */
        _this._playPromise = null;
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
            didPass: pass && !utils_1.detectSilence(this._values),
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
        this.emit(OutputTest.Events.End, report.didPass, report);
        return report;
    };
    /**
     * Cleanup the test.
     */
    OutputTest.prototype._cleanup = function () {
        var _this = this;
        if (this._volumeTimeout) {
            clearTimeout(this._volumeTimeout);
        }
        if (this._audioContext) {
            this._audioContext.close();
        }
        if (this._playPromise) {
            this._playPromise.then(function () {
                // we need to try to wait for the call to play to finish before we can
                // pause the audio
                if (_this._audioElement) {
                    _this._audioElement.pause();
                }
            }).catch(function () {
                // this means play errored out so we do nothing
            });
        }
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
     * @event `OutputTest.Events.Volume`
     */
    OutputTest.prototype._startTest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var invalidReasons, source, analyser_1, frequencyDataBytes_1, volumeEvent_1, _a, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, optionValidation_1.validateOptions(this._options, {
                                deviceId: optionValidation_1.validateDeviceId,
                                duration: optionValidation_1.validateTime,
                                pollIntervalMs: optionValidation_1.validateTime,
                            })];
                    case 1:
                        invalidReasons = _b.sent();
                        if (invalidReasons) {
                            throw new errors_1.InvalidOptionsError(invalidReasons);
                        }
                        if (!this._options.audioContextFactory) {
                            throw polyfills_1.AudioContextUnsupportedError;
                        }
                        this._audioContext = new this._options.audioContextFactory();
                        if (!this._options.audioElementFactory) {
                            throw polyfills_1.AudioUnsupportedError;
                        }
                        this._audioElement =
                            new this._options.audioElementFactory(this._options.testURI);
                        this._audioElement.setAttribute('crossorigin', 'anonymous');
                        this._audioElement.loop = !!this._options.doLoop;
                        if (!this._options.deviceId) return [3 /*break*/, 4];
                        if (!this._audioElement.setSinkId) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._audioElement.setSinkId(this._options.deviceId)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        // Non-fatal error
                        this._onError(new errors_1.UnsupportedError('A `deviceId` was passed to the `OutputTest` but `setSinkId` is ' +
                            'not supported in this browser.'));
                        _b.label = 4;
                    case 4:
                        source = this._audioContext.createMediaElementSource(this._audioElement);
                        source.connect(this._audioContext.destination);
                        analyser_1 = this._audioContext.createAnalyser();
                        analyser_1.smoothingTimeConstant = 0.4;
                        analyser_1.fftSize = 64;
                        source.connect(analyser_1);
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
                                : (_this._audioElement && _this._audioElement.ended) || isTimedOut;
                            if (stop) {
                                if (_this._options.passOnTimeout === false) {
                                    _this._onError(new errors_1.DiagnosticError(undefined, 'Test timed out.'));
                                }
                                _this.stop(_this._options.passOnTimeout);
                            }
                            else {
                                _this._volumeTimeout = setTimeout(volumeEvent_1, _this._options.pollIntervalMs);
                            }
                        };
                        this._playPromise = this._audioElement.play();
                        return [4 /*yield*/, this._playPromise];
                    case 5:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, enumerateDevices_1.getDefaultDevices()];
                    case 6:
                        _a._defaultDevices = _b.sent();
                        this._volumeTimeout = setTimeout(volumeEvent_1, this._options.pollIntervalMs);
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
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
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
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
        pollIntervalMs: 100,
        testURI: constants_1.INCOMING_SOUND_URL,
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
 * Test an audio output device and measures the volume.
 * @param options
 */
function testOutputDevice(options) {
    return new OutputTest(options);
}
exports.testOutputDevice = testOutputDevice;
//# sourceMappingURL=OutputTest.js.map