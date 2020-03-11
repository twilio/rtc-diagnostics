"use strict";
// tslint:disable no-empty
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../../lib/errors");
var MockAnalyserNode_1 = require("./MockAnalyserNode");
var MockMediaElementAudioSourceNode_1 = require("./MockMediaElementAudioSourceNode");
var MockMediaStreamAudioSourceNode_1 = require("./MockMediaStreamAudioSourceNode");
var defaultMockAudioContextFactoryOptions = {
    analyserNodeOptions: MockAnalyserNode_1.MockAnalyserNode.defaultOptions,
};
exports.mockAudioContextFactory = function (options) {
    if (options === void 0) { options = defaultMockAudioContextFactoryOptions; }
    return /** @class */ (function () {
        function class_1() {
        }
        class_1.prototype.close = function () { };
        class_1.prototype.createAnalyser = function () {
            if (options.doThrow && options.doThrow.createAnalyser) {
                throw new errors_1.DiagnosticError();
            }
            return new MockAnalyserNode_1.MockAnalyserNode(options.analyserNodeOptions);
        };
        class_1.prototype.createMediaElementSource = function () {
            if (options.doThrow && options.doThrow.createMediaElementSource) {
                throw new errors_1.DiagnosticError();
            }
            return new MockMediaElementAudioSourceNode_1.MockMediaElementAudioSourceNode();
        };
        class_1.prototype.createMediaStreamSource = function () {
            if (options.doThrow && options.doThrow.createMediaStreamSource) {
                throw new errors_1.DiagnosticError();
            }
            return new MockMediaStreamAudioSourceNode_1.MockMediaStreamAudioSourceNode();
        };
        return class_1;
    }());
};
//# sourceMappingURL=MockAudioContext.js.map