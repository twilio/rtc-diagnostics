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
var sinon = require("sinon");
var MockMediaStream_1 = require("./MockMediaStream");
function mockGetUserMediaFactory(opts) {
    if (opts === void 0) { opts = {}; }
    var options = __assign({ mediaStream: new MockMediaStream_1.MockMediaStream() }, opts);
    return options.throw
        ? sinon.stub().rejects(options.throw)
        : sinon.stub().resolves(options.mediaStream);
}
exports.mockGetUserMediaFactory = mockGetUserMediaFactory;
//# sourceMappingURL=mockGetUserMedia.js.map