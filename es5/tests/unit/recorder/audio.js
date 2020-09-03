"use strict";
// tslint:disable only-arrow-functions
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var sinon = require("sinon");
var audio_1 = require("../../../lib/recorder/audio");
describe('AudioRecorder', function () {
    var root = global;
    var audioRecorder;
    var audioContext;
    var mediaRecorderInstance;
    var blobInstance;
    var stream;
    var mediaStreamTrack1;
    var mediaStreamTrack2;
    var MediaRecorderFactory;
    var origBlob;
    var origURL;
    beforeEach(function () {
        origBlob = root.Blob;
        origURL = root.URL;
        root.Blob = function (audioData, options) {
            this.audioData = audioData;
            this.options = options;
            blobInstance = this;
        };
        root.URL = { createObjectURL: function (blob) { return blob.audioData.join(); } };
        audioContext = {};
        mediaStreamTrack1 = { stop: sinon.stub() };
        mediaStreamTrack2 = { stop: sinon.stub() };
        stream = {
            clone: sinon.stub().returns({
                getTracks: function () { return ([
                    mediaStreamTrack1,
                    mediaStreamTrack2,
                ]); },
            }),
        };
        MediaRecorderFactory = function () {
            var _this = this;
            this.start = sinon.stub();
            this.stop = sinon.stub().callsFake(function () {
                _this.onstop();
            });
            mediaRecorderInstance = this;
        };
        audioRecorder = new audio_1.AudioRecorder({ stream: stream, MediaRecorderFactory: MediaRecorderFactory, audioContext: audioContext });
    });
    afterEach(function () {
        root.Blob = origBlob;
        root.URL = origURL;
    });
    it('should use a clone of the MediaStream', function () {
        sinon.assert.calledOnce(stream.clone);
    });
    it('should start recording media', function () {
        sinon.assert.calledOnce(mediaRecorderInstance.start);
    });
    it('should reject if stop is called more than once', function () {
        assert(audioRecorder.stop());
        assert.rejects(audioRecorder.stop());
    });
    it('should reject if generating url fails', function () {
        root.Blob = function () {
            throw new Error('foo err');
        };
        assert.rejects(audioRecorder.stop());
    });
    it('should stop media recorder', function () {
        audioRecorder.stop();
        sinon.assert.calledOnce(mediaRecorderInstance.stop);
    });
    it('should stop MediaStreamTracks on stop', function () {
        audioRecorder.stop();
        sinon.assert.calledOnce(mediaStreamTrack1.stop);
        sinon.assert.calledOnce(mediaStreamTrack2.stop);
    });
    it('should generate url from audioData', function () {
        mediaRecorderInstance.ondataavailable({ data: 'foo' });
        mediaRecorderInstance.ondataavailable({ data: 'bar' });
        mediaRecorderInstance.ondataavailable({ data: 'baz' });
        audioRecorder.stop();
        assert.equal(audioRecorder.url, 'foo,bar,baz');
    });
});
//# sourceMappingURL=audio.js.map