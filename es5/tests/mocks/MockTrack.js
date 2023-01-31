"use strict";
// tslint:disable no-empty
Object.defineProperty(exports, "__esModule", { value: true });
var MockTrack = /** @class */ (function () {
    function MockTrack(options) {
        this.srcObject = null;
        this.kind = options.kind;
    }
    MockTrack.prototype.getSettings = function () {
        return {
            height: 1080,
            width: 1920,
        };
    };
    MockTrack.prototype.stop = function () { };
    return MockTrack;
}());
exports.MockTrack = MockTrack;
//# sourceMappingURL=MockTrack.js.map