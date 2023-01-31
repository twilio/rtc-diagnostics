/*! rtc-diagnostics.js 1.0.1

The following license applies to all parts of this software except as
documented below.

    Copyright (C) 2019-2023 Twilio, inc.
 
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
var audio_1 = require("./recorder/audio");
var optionValidation_1 = require("./utils/optionValidation");
/**
 * [[AudioInputTest]] class that parses options and starts an audio input device
 * test.
 *
 * Please see [[testAudioInputDevice]] for details and recommended practices.
 */
var AudioInputTest = /** @class */ (function (_super) {
    __extends(AudioInputTest, _super);
    /**
     * Initializes the `startTime` and `options`.
     * @param options Optional settings to pass to the test.
     */
    function AudioInputTest(options) {
        var _this = _super.call(this) || this;
        /**
         * Active warnings to keep track of.
         */
        _this.activeWarnings = new Set();
        /**
         * An `AudioContext` to use for generating volume levels.
         */
        _this._audioContext = null;
        /**
         * An AudioRecorder object used to capture audio input during the test
         */
        _this._audioRecorder = null;
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
         * A `MediaStream` that is created from the input device.
         */
        _this._mediaStream = null;
        /**
         * Volume levels generated from the audio source during the run time of the
         * test.
         */
        _this._volumeStats = {
            timestamps: [],
            values: [],
        };
        /**
         * The timeout that causes the volume event to loop; created by `setTimeout`.
         */
        _this._volumeTimeout = null;
        _this._options = __assign(__assign({}, AudioInputTest.defaultOptions), options);
        // We need to use a `setTimeout` here to prevent a race condition.
        // This allows event listeners to bind before the test starts.
        setTimeout(function () { return _this._startTest(); });
        return _this;
    }
    /**
     * Stop the currently running [[AudioInputTest]].
     */
    AudioInputTest.prototype.stop = function () {
        var _this = this;
        if (typeof this._endTime === 'number') {
            this._onWarning(new errors_1.AlreadyStoppedError());
            return;
        }
        this._endTime = Date.now();
        var report = {
            deviceId: this._options.deviceId || (this._defaultDevices.audioinput &&
                this._defaultDevices.audioinput.deviceId),
            errors: this._errors,
            testName: AudioInputTest.testName,
            values: this._volumeStats.values,
        };
        if (this._startTime) {
            report.testTiming = {
                duration: this._endTime - this._startTime,
                end: this._endTime,
                start: this._startTime,
            };
        }
        var onEnd = function () {
            _this._cleanup();
            _this.emit(AudioInputTest.Events.End, report);
        };
        if (this._options.enableRecording && this._audioRecorder) {
            this._audioRecorder.stop().then(function () {
                report.recordingUrl = _this._audioRecorder.url;
            }).catch(function (ex) {
                _this._onError(ex);
            }).finally(onEnd);
        }
        else {
            onEnd();
        }
    };
    /**
     * Clean up any instantiated objects (i.e. `AudioContext`, `MediaStreams`,
     * etc.).
     * Called by `.stop`.
     */
    AudioInputTest.prototype._cleanup = function () {
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
    AudioInputTest.prototype._onError = function (error) {
        this._errors.push(error);
        this.emit(AudioInputTest.Events.Error, error);
    };
    /**
     * Called every `AudioInputTest._options.volumeEventIntervalMs` amount of
     * milliseconds, emits the volume passed to it as a `Events.Volume` event.
     * @param value the volume
     */
    AudioInputTest.prototype._onVolume = function (value) {
        var now = Date.now();
        if (!this._volumeStats.max || value > this._volumeStats.max) {
            this._volumeStats.max = value;
        }
        this._volumeStats.values.push(value);
        this._volumeStats.timestamps.push(now);
        this.emit(AudioInputTest.Events.Volume, value);
        // Find the last 3 seconds worth of volume values.
        var startIndex = this._volumeStats.timestamps.findIndex(function (timestamp) { return now - timestamp <= 3000; });
        // We want to do nothing at 1 and not 0 here because this guarantees that
        // there is at least one timestamp before the sample set. This means that
        // there are at least three seconds of samples.
        if (startIndex < 1) {
            return;
        }
        var samples = this._volumeStats.values.slice(startIndex > 0
            ? startIndex
            : 0);
        // Calculate the standard deviation of the sample set.
        var sampleAverage = samples.reduce(function (sample, partialSum) { return sample + partialSum; }, 0) / samples.length;
        var diffSquared = samples.map(function (sample) { return Math.pow(sample - sampleAverage, 2); });
        var stdDev = Math.sqrt(diffSquared.reduce(function (sample, partialSum) { return sample + partialSum; }, 0) / samples.length);
        // 255 is max volume value; 2.55 is 1% of max
        var isConstantAudio = stdDev <= 2.55;
        if (isConstantAudio && sampleAverage <= 2.55) {
            if (!this.activeWarnings.has(constants_1.WarningName.LowAudioLevel)) {
                this.activeWarnings.add(constants_1.WarningName.LowAudioLevel);
                this.emit(AudioInputTest.Events.Warning, constants_1.WarningName.LowAudioLevel);
            }
        }
        else if (this.activeWarnings.has(constants_1.WarningName.LowAudioLevel)) {
            this.activeWarnings.delete(constants_1.WarningName.LowAudioLevel);
            this.emit(AudioInputTest.Events.WarningCleared, constants_1.WarningName.LowAudioLevel);
        }
    };
    /**
     * Warning event handler.
     * @param warning
     */
    AudioInputTest.prototype._onWarning = function (error) {
        if (this._options.debug) {
            // tslint:disable-next-line no-console
            console.warn(error);
        }
    };
    /**
     * Entry point into the audio input device test. Uses the `MediaStream` that the
     * object was set up with, and performs a fourier transform on the audio data
     * using an `AnalyserNode`. The output of the fourier transform are the
     * relative amplitudes of the frequencies of the audio data. The average of
     * this data can then be used as an estimate as the average volume of the
     * entire volume source.
     *
     * @event Events.Volume
     */
    AudioInputTest.prototype._startTest = function () {
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
                        if (!this._options.audioContextFactory) {
                            throw polyfills_1.AudioContextUnsupportedError;
                        }
                        // We need to initialize AudioContext and MediaRecorder right after calling gUM
                        // and before enumerateDevices. Certain browsers and headsets (Safari, AirPods)
                        // loses the "user action" after enumerating devices.
                        this._audioContext = new this._options.audioContextFactory();
                        if (this._options.enableRecording) {
                            this._audioRecorder = new this._options.audioRecorderFactory({
                                audioContext: this._audioContext,
                                stream: this._mediaStream,
                            });
                        }
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
                        else if (typeof Error !== 'undefined' && error_1 instanceof Error) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'An error has occurred.'));
                        }
                        else {
                            this._onError(new errors_1.DiagnosticError(undefined, 'Unknown error occurred.'));
                            this._onWarning(error_1);
                        }
                        this.stop();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Name of the test.
     */
    AudioInputTest.testName = 'audio-input-test';
    /**
     * Default options for the [[AudioInputTest]].
     */
    AudioInputTest.defaultOptions = {
        audioContextFactory: polyfills_1.AudioContext,
        audioRecorderFactory: audio_1.AudioRecorder,
        debug: false,
        duration: Infinity,
        enableRecording: false,
        enumerateDevices: polyfills_1.enumerateDevices,
        getUserMedia: polyfills_1.getUserMedia,
        volumeEventIntervalMs: 100,
    };
    return AudioInputTest;
}(events_1.EventEmitter));
exports.AudioInputTest = AudioInputTest;
(function (AudioInputTest) {
    /**
     * Possible events that an [[AudioInputTest]] might emit. See [[AudioInputTest.on]].
     */
    var Events;
    (function (Events) {
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Volume"] = "volume";
        Events["Warning"] = "warning";
        Events["WarningCleared"] = "warning-cleared";
    })(Events = AudioInputTest.Events || (AudioInputTest.Events = {}));
})(AudioInputTest = exports.AudioInputTest || (exports.AudioInputTest = {}));
exports.AudioInputTest = AudioInputTest;
/**
 * [[AudioInputTest]] tests audio input capabilities. It serves to help diagnose
 * potential audio device issues that would prevent audio from being recognized
 * in a WebRTC call.
 *
 * ---
 *
 * The [[AudioInputTest]] class is an `EventEmitter` (please see [[AudioInputTest.on]] for
 * events and their details) and helps to diagnose issues by capturing user
 * audio and emitting the volume levels detected in that media.
 * ```ts
 * import { AudioInputTest, testAudioInputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioInputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const audioInputTest: AudioInputTest = testAudioInputDevice(options);
 * ```
 * Applications can use the volume events emitted by the test to update their UI
 * to show to the user whether or not their media was captured successfully.
 * ```ts
 * audioInputTest.on(AudioInputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 * The test can be normally stopped two ways: allowing the test to time out and
 * stopping the test manually.
 *
 * To end the test manually, the application can ask the end-user to confirm
 * that the volume levels it emits are what the end-user expects. If so, the
 * application can call the [[AudioInputTest.stop]] method with `true`. Otherwise,
 * if the audio values are not expected, the application can call
 * [[AudioInputTest.stop]] with `false`.
 * ```ts
 * // The UI should indicate that if the volume values are what the user
 * // expects, they can click this button to pass and stop the test...
 * const volumeCorrectButton = ...;
 * volumeCorrectButton.addEventListener('click', () => {
 *   audioInputTest.stop(true);
 * });
 *
 * // ...otherwise, if the volume levels are not what they expect, they can
 * // click this.
 * const volumeIncorrectButton = ...;
 * volumeIncorrectButton.addEventListener('click', () => {
 *   audioInputTest.stop(false);
 * });
 * ```
 * Calling [[AudioInputTest.stop]] will immediately end the test.
 *
 * ---
 *
 * The [[AudioInputTest]] object will always emit a [[AudioInputTest.Report]] with the
 * [[AudioInputTest.Events.End]] event, regardless of the occurrence of errors during
 * the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that the
 * value of [[AudioInputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[AudioInputTest.Report.errors]] upon completion of the test.
 *
 * ---
 *
 * Note: In Firefox, `deviceId` will be ignored, and instead the user will get a
 * browser pop-up where they can select the device they want to use. This is
 * unavoidable as it is Firefox's implementation of `getUserMedia()`.
 *
 * In most browsers, such as Chrome and Safari, when `getUserMedia()` is called,
 * a prompt will ask the user for broad microphone-access permissions. Then, the
 * parameters passed to `getUserMedia()` will determine the device that is
 * captured.
 *
 * Firefox differs in that the prompt will ask for a specific input device.
 * Regardless of the parameters passed to `getUserMedia()`, the device
 * selected in that prompt will be captured. If the user opts to have the
 * browser "Remember this selection" within the prompt, the device that was
 * selected will be captured by every future `getUserMedia()` call as well.
 * This selection will persist even through changes in the system OS, i.e. when
 * default devices are changed. In order to change the device, the user has to
 * revoke the webpage's microphone-access permissions for the prompt to show
 * again.
 *
 * Please see this link for more information on microphone access in Firefox:
 * https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions
 *
 * ---
 *
 * The function [[testAudioInputDevice]] serves as a factory function that accepts
 * [[AudioInputTest.Options]] as its only parameter and will instantiate an
 * [[AudioInputTest]] object with those options.
 * ```ts
 * import { AudioInputTest, testAudioInputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioInputTest.Options = { ... };
 * const audioInputTest: AudioInputTest = testAudioInputDevice(options);
 * ```
 *
 * @param options Options to pass to the [[AudioInputTest]] constructor.
 */
function testAudioInputDevice(options) {
    return new AudioInputTest(options);
}
exports.testAudioInputDevice = testAudioInputDevice;

},{"./constants":5,"./errors":12,"./polyfills":17,"./recorder/audio":18,"./utils/optionValidation":22,"events":24}],2:[function(require,module,exports){
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
 * [[AudioOutputTest]] class that parses options and starts an audio output device
 * test.
 *
 * Please see [[testAudioOutputDevice]] for details and recommended practices.
 */
var AudioOutputTest = /** @class */ (function (_super) {
    __extends(AudioOutputTest, _super);
    /**
     * Sets up several things for the [[AudioOutputTest]] to run later in the
     * `_startTest` function.
     * @param options Optional settings to pass to the test.
     */
    function AudioOutputTest(options) {
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
        _this._options = __assign(__assign({}, AudioOutputTest.defaultOptions), options);
        _this._startTime = Date.now();
        // We need to use a `setTimeout` here to prevent a race condition.
        // This allows event listeners to bind before the test starts.
        setTimeout(function () { return _this._startTest(); });
        return _this;
    }
    /**
     * Stops the test.
     */
    AudioOutputTest.prototype.stop = function () {
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
            errors: this._errors,
            testName: AudioOutputTest.testName,
            testTiming: {
                duration: this._endTime - this._startTime,
                end: this._endTime,
                start: this._startTime,
            },
            testURI: this._options.testURI,
            values: this._values,
        };
        this.emit(AudioOutputTest.Events.End, report);
    };
    /**
     * Cleanup the test.
     */
    AudioOutputTest.prototype._cleanup = function () {
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
    AudioOutputTest.prototype._onError = function (error) {
        this._errors.push(error);
        this.emit(AudioOutputTest.Events.Error, error);
    };
    /**
     * Volume event handler, adds the value to the list `_values` and emits it
     * under the event `volume`.
     * @param volume
     */
    AudioOutputTest.prototype._onVolume = function (volume) {
        this._values.push(volume);
        this.emit(AudioOutputTest.Events.Volume, volume);
    };
    /**
     * Warning event handler.
     * @param warning
     */
    AudioOutputTest.prototype._onWarning = function (error) {
        if (this._options.debug) {
            // tslint:disable-next-line no-console
            console.warn(error);
        }
    };
    /**
     * Entry point of the test, called after setup in the constructor.
     * Emits the volume levels of the audio.
     *
     * @event [[AudioOutputTest.Events.Volume]]
     */
    AudioOutputTest.prototype._startTest = function () {
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
                                _this.stop();
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
                            throw new errors_1.UnsupportedError('A `deviceId` was passed to the `AudioOutputTest` but `setSinkId` is ' +
                                'not supported in this browser.');
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
                        else if (typeof Error !== 'undefined' && error_1 instanceof Error) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'An error has occurred.'));
                        }
                        else {
                            this._onError(new errors_1.DiagnosticError(undefined, 'Unknown error occurred.'));
                            this._onWarning(error_1);
                        }
                        this.stop();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * The name of the test.
     */
    AudioOutputTest.testName = 'audio-output-test';
    /**
     * Default options for the [[AudioOutputTest]]. Overwritten by any option passed
     * during the construction of the test.
     */
    AudioOutputTest.defaultOptions = {
        audioContextFactory: polyfills_1.AudioContext,
        audioElementFactory: polyfills_1.Audio,
        debug: false,
        doLoop: true,
        duration: Infinity,
        enumerateDevices: polyfills_1.enumerateDevices,
        testURI: constants_1.INCOMING_SOUND_URL,
        volumeEventIntervalMs: 100,
    };
    return AudioOutputTest;
}(events_1.EventEmitter));
exports.AudioOutputTest = AudioOutputTest;
(function (AudioOutputTest) {
    /**
     * Events that the [[AudioOutputTest]] will emit as it runs.
     * Please see [[AudioOutputTest.on]] for how to listen to these
     * events.
     */
    var Events;
    (function (Events) {
        Events["End"] = "end";
        Events["Error"] = "error";
        Events["Volume"] = "volume";
    })(Events = AudioOutputTest.Events || (AudioOutputTest.Events = {}));
})(AudioOutputTest = exports.AudioOutputTest || (exports.AudioOutputTest = {}));
exports.AudioOutputTest = AudioOutputTest;
/**
 * [[AudioOutputTest]] tests audio output capabilities. It serves to help diagnose
 * potential audio device issues that would prevent a user from being able to
 * hear audio.
 *
 * ---
 *
 * The [[AudioOutputTest]] class is an `EventEmitter` (please see [[AudioOutputTest.on]] for
 * events and their details) and helps to diagnose issues by playing a sound clip
 * (by default the sound clip is the ringing tone from the `twilio-client.js`
 * SDK) and emitting volume events of the sound clip as it plays.
 * ```ts
 * import { AudioOutputTest, testAudioOutputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioOutputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const audioOutputTest: AudioOutputTest = testAudioOutputDevice(options);
 * ```
 * The application can use the volume events to show in its UI that audio is
 * playing and that the end-user should be hearing something.
 * ```ts
 * audioOutputTest.on(AudioOutputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 *
 * The application should ask the end-user to confirm that the sound being played
 * can be heard. The application should call [[AudioOutputTest.stop]] with `true` if
 * the end-user hears the sound, and `false` if not.
 * ```ts
 * // If the user was able to hear the audio, the UI should indicate they should
 * // click this button...
 * const passButton = ...;
 * passButton.on('click', () => {
 *   audioOutputTest.stop();
 *   // display a confirmation dialog to the user
 * });
 *
 * // ...conversely, if they were not able to hear the audio, they should click
 * // this one.
 * const failButton = ...;
 * failButton.on('click', () => {
 *   audioOutputTest.stop();
 *   // display a warning to the user
 * });
 * ```
 * Caling [[AudioOutputTest.stop]] will immediately end the test.
 *
 * ---
 *
 * The [[AudioOutputTest]] object will always emit a [[AudioOutputTest.Report]] with
 * the [[AudioOutputTest.Events.End]] event, regardless of the occurence of errors
 * during the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that the
 * value of [[AudioOutputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[AudioOutputTest.Report.errors]] upon completion of the test.
 *
 * If the data at `testURI` is unable to be loaded, meaning the error event is
 * raised on the audio element, a fatal error has occurred.
 *
 * If `doLoop` is set to `false`, then the test will run for either the option
 * `duration`, or the full duration of the audio file, which ever is shorter.
 * If `doLoop` is set to `true`, it will only run as long as the `duration`
 * option.
 *
 * ---
 *
 * The function [[testAudioOutputDevice]] serves as factory function that accepts
 * [[AudioOutputTest.Options]] as its only parameter and will instantiate an
 * [[AudioOutputTest]] object with those options.
 * ```ts
 * import { AudioOutputTest, testAudioOutputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioOutputTest.Options = { ... };
 * const audioOutputTest: AudioOutputTest = testAudioOutputDevice(options);
 * ```
 * @param options Options to pass to the [[AudioOutputTest]] constructor.
 */
function testAudioOutputDevice(options) {
    return new AudioOutputTest(options);
}
exports.testAudioOutputDevice = testAudioOutputDevice;

},{"./constants":5,"./errors":12,"./polyfills":17,"./utils/optionValidation":22,"events":24}],3:[function(require,module,exports){
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

},{"./constants":5,"./errors/DiagnosticError":8,"./utils/candidate":21,"events":24}],4:[function(require,module,exports){
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
                        else if (typeof Error !== 'undefined' && error_1 instanceof Error) {
                            this._onError(new errors_1.DiagnosticError(error_1, 'An error has occurred.'));
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

},{"./errors":12,"./polyfills":17,"./utils/optionValidation":22,"events":24}],5:[function(require,module,exports){
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
 * Minimum bitrate samples required to emit warnings.
 * See [[WarningName.LowBitrate]]
 */
exports.MIN_BITRATE_SAMPLE_COUNT = 5;
/**
 * @private
 * Minimum number of failing bitrate values before emitting a warning.
 * See [[WarningName.LowBitrate]]
 */
exports.MIN_BITRATE_FAIL_COUNT = 3;
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
 * All of the expected error names to be thrown by the diagnostics tests.
 * These names are set in the error objects as the `.name` member.
 */
var ErrorName;
(function (ErrorName) {
    ErrorName["AlreadyStoppedError"] = "already-stopped";
    ErrorName["DiagnosticError"] = "diagnostic";
    ErrorName["InvalidOptionsError"] = "invalid-options";
    ErrorName["InvalidStateError"] = "invalid-state";
    ErrorName["UnsupportedError"] = "unsupported";
})(ErrorName = exports.ErrorName || (exports.ErrorName = {}));
/**
 * All of the expected warnings raised by the diagnostics tests.
 * A `warning-cleared` event is raised if there is an active warning
 * and if the criteria of the warning are no longer met.
 *
 * Example:
 *
 * ```ts
 * test.on(AudioInputTest.Events.Warning, (warningName: WarningName) => {
 *  console.log(`Warning detected: ${warningName}`);
 * });
 *
 * test.on(AudioInputTest.Events.WarningCleared, (warningName: WarningName) => {
 *  console.log(`Warning cleared: ${warningName}`);
 * });
 * ```
 *
 */
var WarningName;
(function (WarningName) {
    /**
     * Raised by the [[AudioInputTest]] when the volume events recorded are both low and constant.
     * The criteria for raising this warning are:
     * - If there are at least three seconds worth of audio samples.
     * - The standard deviation of those samples is less than 1% of the max
     *   possible volume value (255).
     * - The average of those samples is less than 1% of the max possible volume
     *   value (255).
     */
    WarningName["LowAudioLevel"] = "low-audio-level";
    /**
     * Raised by the [[MediaConnectionBitrateTest]] when the recorded bitrates are consistently lower than a certain threshold.
     * The criteria for raising this warning are:
     *  - At least 5 seconds worth of bitrate values have been recorded.
     *  - 3 out of last 5 bitrate values are less than [[MediaConnectionBitrateTest.Options.minBitrateThreshold]].
     */
    WarningName["LowBitrate"] = "low-bitrate";
})(WarningName = exports.WarningName || (exports.WarningName = {}));

},{"../package.json":23}],6:[function(require,module,exports){
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
var AudioInputTest_1 = require("./AudioInputTest");
exports.AudioInputTest = AudioInputTest_1.AudioInputTest;
exports.testAudioInputDevice = AudioInputTest_1.testAudioInputDevice;
var AudioOutputTest_1 = require("./AudioOutputTest");
exports.AudioOutputTest = AudioOutputTest_1.AudioOutputTest;
exports.testAudioOutputDevice = AudioOutputTest_1.testAudioOutputDevice;
var constants_1 = require("./constants");
exports.ErrorName = constants_1.ErrorName;
exports.WarningName = constants_1.WarningName;
var DiagnosticError_1 = require("./errors/DiagnosticError");
exports.DiagnosticError = DiagnosticError_1.DiagnosticError;
var MediaConnectionBitrateTest_1 = require("./MediaConnectionBitrateTest");
exports.MediaConnectionBitrateTest = MediaConnectionBitrateTest_1.MediaConnectionBitrateTest;
exports.testMediaConnectionBitrate = MediaConnectionBitrateTest_1.testMediaConnectionBitrate;
var VideoInputTest_1 = require("./VideoInputTest");
exports.testVideoInputDevice = VideoInputTest_1.testVideoInputDevice;
exports.VideoInputTest = VideoInputTest_1.VideoInputTest;
/**
 * If the `Twilio` object does not exist, make it.
 * Then, add the `Diagnostics` object to it.
 * This makes `window.Twilio.Diagnostics` available after loading the bundle in
 * the browser.
 */
window.Twilio = window.Twilio || {};
window.Twilio.Diagnostics = __assign(__assign({}, window.Twilio.Diagnostics), { testAudioInputDevice: AudioInputTest_1.testAudioInputDevice,
    testAudioOutputDevice: AudioOutputTest_1.testAudioOutputDevice,
    testMediaConnectionBitrate: MediaConnectionBitrateTest_1.testMediaConnectionBitrate,
    testVideoInputDevice: VideoInputTest_1.testVideoInputDevice });

},{"./AudioInputTest":1,"./AudioOutputTest":2,"./MediaConnectionBitrateTest":3,"./VideoInputTest":4,"./constants":5,"./errors/DiagnosticError":8}],7:[function(require,module,exports){
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
var constants_1 = require("../constants");
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
        _this.name = constants_1.ErrorName.AlreadyStoppedError;
        return _this;
    }
    return AlreadyStoppedError;
}(InvalidStateError_1.InvalidStateError));
exports.AlreadyStoppedError = AlreadyStoppedError;

},{"../constants":5,"./InvalidStateError":10}],8:[function(require,module,exports){
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
var constants_1 = require("../constants");
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
        _this.name = constants_1.ErrorName.DiagnosticError;
        return _this;
    }
    return DiagnosticError;
}(Error));
exports.DiagnosticError = DiagnosticError;

},{"../constants":5}],9:[function(require,module,exports){
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
var constants_1 = require("../constants");
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
        _this.name = constants_1.ErrorName.InvalidOptionsError;
        return _this;
    }
    return InvalidOptionsError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidOptionsError = InvalidOptionsError;

},{"../constants":5,"./DiagnosticError":8}],10:[function(require,module,exports){
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
var constants_1 = require("../constants");
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
        _this.name = constants_1.ErrorName.InvalidStateError;
        return _this;
    }
    return InvalidStateError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidStateError = InvalidStateError;

},{"../constants":5,"./DiagnosticError":8}],11:[function(require,module,exports){
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
var constants_1 = require("../constants");
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 * Error for when a browser-provided feature isn't available, such as
 * `getUserMedia`.
 */
var UnsupportedError = /** @class */ (function (_super) {
    __extends(UnsupportedError, _super);
    function UnsupportedError(message) {
        var _this = _super.call(this, undefined, message) || this;
        _this.name = constants_1.ErrorName.UnsupportedError;
        return _this;
    }
    return UnsupportedError;
}(DiagnosticError_1.DiagnosticError));
exports.UnsupportedError = UnsupportedError;

},{"../constants":5,"./DiagnosticError":8}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AlreadyStoppedError_1 = require("./AlreadyStoppedError");
exports.AlreadyStoppedError = AlreadyStoppedError_1.AlreadyStoppedError;
var DiagnosticError_1 = require("./DiagnosticError");
exports.DiagnosticError = DiagnosticError_1.DiagnosticError;
var InvalidOptionsError_1 = require("./InvalidOptionsError");
exports.InvalidOptionsError = InvalidOptionsError_1.InvalidOptionsError;
var InvalidStateError_1 = require("./InvalidStateError");
exports.InvalidStateError = InvalidStateError_1.InvalidStateError;
var UnsupportedError_1 = require("./UnsupportedError");
exports.UnsupportedError = UnsupportedError_1.UnsupportedError;

},{"./AlreadyStoppedError":7,"./DiagnosticError":8,"./InvalidOptionsError":9,"./InvalidStateError":10,"./UnsupportedError":11}],13:[function(require,module,exports){
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

},{"../errors":12}],14:[function(require,module,exports){
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

},{"../errors":12}],15:[function(require,module,exports){
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

},{"../errors":12}],16:[function(require,module,exports){
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

},{"../errors":12}],17:[function(require,module,exports){
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

},{"./Audio":13,"./AudioContext":14,"./enumerateDevices":15,"./getUserMedia":16}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
var encoder_1 = require("./encoder");
/**
 * The [[AudioRecorder]] allows cross browser recording of audio from an input MediaStream.
 * It uses the native MediaStream Recording APIs if available, else, it process raw audio data
 * and converts it to a blob.
 * @internalapi
 */
var AudioRecorder = /** @class */ (function () {
    /**
     * Construct an [[AudioRecorder]] instance and will start the recording immediately.
     * @constructor
     * @param options
     */
    function AudioRecorder(options) {
        var _this = this;
        var _a, _b;
        /**
         * The raw audio data captured during the test
         */
        this._audioData = [];
        /**
         * Promise handle after calling .stop()
         */
        this._stopPromise = null;
        /**
         * The resuling object url that can be used for audio playback
         */
        this._url = '';
        var factory = (_b = (_a = options.MediaRecorderFactory, (_a !== null && _a !== void 0 ? _a : window.MediaRecorder)), (_b !== null && _b !== void 0 ? _b : encoder_1.Encoder));
        this._stream = options.stream.clone();
        this._mediaRecorder = new factory(this._stream, options.audioContext);
        this._mediaRecorder.ondataavailable = function (e) { return _this._audioData.push(e.data); };
        this._mediaRecorder.start();
    }
    /**
     * Stops the recording process.
     * If successful, the `.url` property will be populated.
     */
    AudioRecorder.prototype.stop = function () {
        var _this = this;
        if (this._stopPromise) {
            return Promise.reject(new errors_1.DiagnosticError(undefined, 'MediaRecorder has already stopped'));
        }
        this._stopPromise = new Promise(function (resolve, reject) {
            _this._mediaRecorder.onstop = function () {
                try {
                    _this._stream.getTracks().forEach(function (track) { return track.stop(); });
                    _this._generateObjectUrl();
                }
                catch (ex) {
                    reject(new errors_1.DiagnosticError(ex, 'Unable to generate Object URL'));
                    return;
                }
                resolve();
            };
            _this._mediaRecorder.stop();
        });
        return this._stopPromise;
    };
    /**
     * Generates the object url that can be used for audio playback from raw audio data
     */
    AudioRecorder.prototype._generateObjectUrl = function () {
        // Select default browser mime type if it exists.
        // Otherwise, use wav for faster and simple encoding.
        var type = this._mediaRecorder && this._mediaRecorder.mimeType ? this._mediaRecorder.mimeType : 'audio/wav';
        var blob = new Blob(this._audioData, { type: type });
        this._url = URL.createObjectURL(blob);
        this._audioData = [];
    };
    Object.defineProperty(AudioRecorder.prototype, "url", {
        /**
         * The resuling object url that can be used for audio playback
         */
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    return AudioRecorder;
}());
exports.AudioRecorder = AudioRecorder;

},{"../errors":12,"./encoder":19}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../../constants");
var worker_1 = require("./worker");
/**
 * The [[Encoder]] reads audio data via an AudioContext and encodes it to a wav data format.
 * The wav data can be then converted into a blob which can be used for playback.
 * @internalapi
 */
var Encoder = /** @class */ (function () {
    /**
     * Construct an [[Encoder]] instance and and prepares the Web Worker
     * @constructor
     * @param stream - The input MediaStream to record
     * @param audioContext - The AudioContext instance to use for processing audio data
     */
    function Encoder(stream, audioContext, audioEncoder) {
        if (audioEncoder === void 0) { audioEncoder = worker_1.waveEncoder; }
        /**
         * Called when raw data is available
         * @override
         */
        this.ondataavailable = function () { return undefined; };
        /**
         * Called when encoding stops
         * @override
         */
        this.onstop = function () { return undefined; };
        this._encoder = createWorker(audioEncoder);
        this._audioContext = audioContext;
        this._stream = stream;
    }
    /**
     * Starts the encoding process
     */
    Encoder.prototype.start = function () {
        var _a;
        var _this = this;
        var src = this._audioContext.createMediaStreamSource(this._stream);
        var processor = (_a = this._audioContext).createScriptProcessor.apply(_a, constants_1.ENCODER_PARAMS);
        processor.onaudioprocess = function (e) { return _this._encoder.postMessage(['encode', e.inputBuffer.getChannelData(0)]); };
        src.connect(processor);
        processor.connect(this._audioContext.destination);
    };
    /**
     * Stops the encoding process
     */
    Encoder.prototype.stop = function () {
        var _this = this;
        this._encoder.addEventListener('message', function (e) {
            _this.ondataavailable(e);
            _this.onstop();
        });
        this._encoder.postMessage(['dump', this._audioContext.sampleRate]);
    };
    return Encoder;
}());
exports.Encoder = Encoder;
/**
 * Creates a worker from a js function
 * @internalapi
 */
function createWorker(fn) {
    return new Worker(URL.createObjectURL(new Blob([fn
            .toString()
            .replace(/^(\(\)\s*=>|function\s*\(\))\s*{/, '')
            .replace(/}$/, '')])));
}

},{"../../constants":5,"./worker":20}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Encodes raw buffer into a wav format
 * Copied from https://github.com/chris-rudmin/Recorderjs
 * @internalapi
 */
/* tslint:disable */
var waveEncoder = function () {
    var BYTES_PER_SAMPLE = 2;
    var recorded = [];
    function encode(buffer) {
        var length = buffer.length;
        var data = new Uint8Array(length * BYTES_PER_SAMPLE);
        for (var i = 0; i < length; i++) {
            var index = i * BYTES_PER_SAMPLE;
            var sample = buffer[i];
            if (sample > 1) {
                sample = 1;
            }
            else if (sample < -1) {
                sample = -1;
            }
            sample = sample * 32768;
            data[index] = sample;
            data[index + 1] = sample >> 8;
        }
        recorded.push(data);
    }
    function dump(sampleRate) {
        var bufferLength = recorded.length ? recorded[0].length : 0;
        var length = recorded.length * bufferLength;
        var wav = new Uint8Array(44 + length);
        var view = new DataView(wav.buffer);
        // RIFF identifier 'RIFF'
        view.setUint32(0, 1380533830, false);
        // file length minus RIFF identifier length and file description length
        view.setUint32(4, 36 + length, true);
        // RIFF type 'WAVE'
        view.setUint32(8, 1463899717, false);
        // format chunk identifier 'fmt '
        view.setUint32(12, 1718449184, false);
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (raw)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * BYTES_PER_SAMPLE, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, BYTES_PER_SAMPLE, true);
        // bits per sample
        view.setUint16(34, 8 * BYTES_PER_SAMPLE, true);
        // data chunk identifier 'data'
        view.setUint32(36, 1684108385, false);
        // data chunk length
        view.setUint32(40, length, true);
        for (var i = 0; i < recorded.length; i++) {
            wav.set(recorded[i], i * bufferLength + 44);
        }
        recorded = [];
        postMessage(wav.buffer, [wav.buffer]);
    }
    onmessage = function (e) {
        if (e.data[0] === 'encode') {
            encode(e.data[1]);
        }
        else if (e.data[0] === 'dump') {
            dump(e.data[1]);
        }
    };
};
exports.waveEncoder = waveEncoder;

},{}],21:[function(require,module,exports){
"use strict";
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internalapi
 * Generate a WebRTC stats report containing relevant information about ICE candidates for
 * the given [PeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection)
 * @param peerConnection
 */
function getRTCIceCandidateStatsReport(peerConnection) {
    return __awaiter(this, void 0, void 0, function () {
        var report, statsArrays, candidatePairs, localCandidates, remoteCandidates, transport, selectedCandidatePairReport, selectedIceCandidatePairStats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, peerConnection.getStats()];
                case 1:
                    report = _a.sent();
                    statsArrays = Array.from(report.values()).reduce(function (result, stat) {
                        switch (stat.type) {
                            case 'candidate-pair':
                                result.candidatePairs.push(stat);
                                break;
                            case 'local-candidate':
                                result.localCandidates.push(stat);
                                break;
                            case 'remote-candidate':
                                result.remoteCandidates.push(stat);
                                break;
                            case 'transport':
                                // This transport is the one being used if selectedCandidatePairId is populated
                                if (stat.selectedCandidatePairId) {
                                    result.transport = stat;
                                }
                                break;
                        }
                        return result;
                    }, { candidatePairs: [], localCandidates: [], remoteCandidates: [] });
                    candidatePairs = statsArrays.candidatePairs;
                    localCandidates = statsArrays.localCandidates;
                    remoteCandidates = statsArrays.remoteCandidates;
                    transport = statsArrays.transport;
                    selectedCandidatePairReport = candidatePairs.find(function (pair) {
                        // Firefox
                        return pair.selected ||
                            // Spec-compliant way
                            (transport && pair.id === transport.selectedCandidatePairId);
                    });
                    if (selectedCandidatePairReport) {
                        selectedIceCandidatePairStats = {
                            localCandidate: localCandidates.find(function (candidate) { return candidate.id === selectedCandidatePairReport.localCandidateId; }),
                            remoteCandidate: remoteCandidates.find(function (candidate) { return candidate.id === selectedCandidatePairReport.remoteCandidateId; }),
                        };
                    }
                    return [2 /*return*/, {
                            iceCandidateStats: __spreadArrays(localCandidates, remoteCandidates),
                            selectedIceCandidatePairStats: selectedIceCandidatePairStats,
                        }];
            }
        });
    });
}
exports.getRTCIceCandidateStatsReport = getRTCIceCandidateStatsReport;

},{}],22:[function(require,module,exports){
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
    if (!(['string', 'undefined'].includes(typeof option) || option === null)) {
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
 * Validate that an option is a `boolean`.
 * @param option The option to check.
 * @returns A possibly undefined string, if the option is valid it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
function validateBoolean(option) {
    if (typeof option !== 'boolean') {
        return "Option must be \"boolean\".";
    }
}
exports.validateBoolean = validateBoolean;
/**
 * @internalapi
 * Validate input options to the [[AudioInputTest]].
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

},{"../polyfills":17}],23:[function(require,module,exports){
module.exports={
    "name": "@twilio/rtc-diagnostics",
    "version": "1.0.1",
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
        "test:integration": "node ./scripts/env.js && karma start"
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
    "dependencies": {
        "@types/events": "3.0.0",
        "@types/node": "12.12.11",
        "events": "3.0.0"
    },
    "devDependencies": {
        "@types/mime": "2.0.2",
        "@types/mocha": "5.2.7",
        "@types/request": "^2.48.5",
        "@types/sinon": "9.0.4",
        "browserify": "16.5.0",
        "is-docker": "2.0.0",
        "karma": "4.4.1",
        "karma-chrome-launcher": "3.1.0",
        "karma-env-preprocessor": "^0.1.1",
        "karma-firefox-launcher": "1.2.0",
        "karma-mocha": "1.3.0",
        "karma-spec-reporter": "0.0.32",
        "karma-typescript": "4.1.1",
        "mocha": "6.2.2",
        "npm-run-all": "4.1.5",
        "nyc": "15.0.0",
        "request": "^2.88.2",
        "sinon": "9.0.2",
        "travis-multirunner": "4.6.0",
        "ts-node": "8.5.2",
        "tsify": "4.0.1",
        "tslint": "5.20.1",
        "twilio": "3.39.1",
        "twilio-release-tool": "1.0.1",
        "typedoc": "0.16.11",
        "typedoc-plugin-as-member-of": "1.0.2",
        "typedoc-plugin-external-module-name": "4.0.6",
        "typedoc-plugin-internal-external": "2.1.1",
        "typedoc-twilio-theme": "1.0.1",
        "typescript": "3.7.2",
        "vinyl-fs": "3.0.3",
        "vinyl-source-stream": "2.0.0"
    }
}

},{}],24:[function(require,module,exports){
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

},{}]},{},[6]);
