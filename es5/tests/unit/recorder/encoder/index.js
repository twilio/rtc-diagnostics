"use strict";
// tslint:disable only-arrow-functions
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
var encoder_1 = require("../../../../lib/recorder/encoder");
describe('Audio Encoder', function () {
    var root = global;
    var stream = {};
    var waveEncoder = {};
    var audioContext;
    var processor;
    var audioEncoder;
    var workerInstance;
    var origWorker;
    var origBlob;
    var origURL;
    beforeEach(function () {
        origBlob = root.Blob;
        origURL = root.URL;
        origWorker = root.Worker;
        root.URL = { createObjectURL: function () { return undefined; } };
        root.Blob = function () {
            return undefined;
        };
        root.Worker = function () {
            var _this = this;
            this.data = [];
            this.addEventListener = function (name, cb) {
                _this.onMessageHandler = cb;
            };
            this.postMessage = function (args) {
                var command = args[0];
                if (command === 'encode') {
                    _this.data.push(args[1]);
                }
                else if (command === 'dump') {
                    _this.onMessageHandler(_this.data.join());
                }
            };
            workerInstance = this;
        };
        processor = { connect: function () { return undefined; } };
        audioContext = {
            createMediaStreamSource: function () { return ({ connect: function () { return undefined; } }); },
            createScriptProcessor: function () { return processor; },
        };
        audioEncoder = new encoder_1.Encoder(stream, audioContext, waveEncoder);
    });
    afterEach(function () {
        root.Worker = origWorker;
        root.Blob = origBlob;
        root.URL = origURL;
    });
    it('should not crash if a customer encoder is not provided', function () {
        audioEncoder = new encoder_1.Encoder(stream, audioContext);
    });
    describe('without handlers', function () {
        it('should not crash if onstop and ondataavailable are not provided', function () {
            audioEncoder.start();
            processor.onaudioprocess({ inputBuffer: { getChannelData: function () { return 'foo'; } } });
            audioEncoder.stop();
        });
    });
    describe('with handlers', function () {
        beforeEach(function () {
            audioEncoder.ondataavailable = sinon.stub();
            audioEncoder.onstop = sinon.stub();
        });
        it('should call ondataavailable handler', function () {
            audioEncoder.start();
            processor.onaudioprocess({ inputBuffer: { getChannelData: function () { return 'foo'; } } });
            processor.onaudioprocess({ inputBuffer: { getChannelData: function () { return 'bar'; } } });
            processor.onaudioprocess({ inputBuffer: { getChannelData: function () { return 'baz'; } } });
            audioEncoder.stop();
            sinon.assert.calledWithExactly(audioEncoder.ondataavailable, 'foo,bar,baz');
        });
        it('should call onstop handler', function () {
            audioEncoder.start();
            processor.onaudioprocess({ inputBuffer: { getChannelData: function () { return 'foo'; } } });
            audioEncoder.stop();
            sinon.assert.calledOnce(audioEncoder.onstop);
        });
    });
});
//# sourceMappingURL=index.js.map