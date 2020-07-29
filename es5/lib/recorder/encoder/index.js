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
//# sourceMappingURL=index.js.map