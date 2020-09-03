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
        // Use wav for faster and simple encoding
        var blob = new Blob(this._audioData, { type: 'audio/wav' });
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
//# sourceMappingURL=audio.js.map