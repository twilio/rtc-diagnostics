"use strict";
// tslint:disable no-empty
Object.defineProperty(exports, "__esModule", { value: true });
var MockAnalyserNode = /** @class */ (function () {
    function MockAnalyserNode(options) {
        this.fftSize = 0;
        this.smoothingTimeConstant = 0;
        this._options = options;
    }
    MockAnalyserNode.prototype.disconnect = function () { };
    MockAnalyserNode.prototype.getByteFrequencyData = function (byteArray) {
        byteArray.fill(this._options.volumeValues);
    };
    Object.defineProperty(MockAnalyserNode.prototype, "frequencyBinCount", {
        get: function () {
            return Math.ceil(this.fftSize / 2);
        },
        enumerable: true,
        configurable: true
    });
    MockAnalyserNode.defaultOptions = {
        volumeValues: 0,
    };
    return MockAnalyserNode;
}());
exports.MockAnalyserNode = MockAnalyserNode;
//# sourceMappingURL=MockAnalyserNode.js.map