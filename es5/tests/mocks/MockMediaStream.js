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
var MockMediaStream = /** @class */ (function () {
    function MockMediaStream(options) {
        if (options === void 0) { options = {}; }
        this.options = __assign(__assign({}, MockMediaStream.defaultOptions), options);
    }
    MockMediaStream.prototype.getTracks = function () {
        return this.options.tracks;
    };
    MockMediaStream.defaultOptions = {
        tracks: [],
    };
    return MockMediaStream;
}());
exports.MockMediaStream = MockMediaStream;
//# sourceMappingURL=MockMediaStream.js.map