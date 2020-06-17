"use strict";
// tslint:disable no-empty
Object.defineProperty(exports, "__esModule", { value: true });
var MockAnalyserNode_1 = require("./MockAnalyserNode");
var MockMediaElementAudioSourceNode_1 = require("./MockMediaElementAudioSourceNode");
var MockMediaStreamAudioDestinationNode_1 = require("./MockMediaStreamAudioDestinationNode");
var MockMediaStreamAudioSourceNode_1 = require("./MockMediaStreamAudioSourceNode");
var defaultMockAudioContextFactoryOptions = {
    analyserNodeOptions: MockAnalyserNode_1.MockAnalyserNode.defaultOptions,
};
exports.mockAudioContextFactory = function (options) {
    if (options === void 0) { options = defaultMockAudioContextFactoryOptions; }
    return /** @class */ (function () {
        function class_1() {
            var _a;
            if ((_a = options.throw) === null || _a === void 0 ? void 0 : _a.construction) {
                throw options.throw.construction;
            }
        }
        class_1.prototype.close = function () { };
        class_1.prototype.createAnalyser = function () {
            var _a;
            if ((_a = options.throw) === null || _a === void 0 ? void 0 : _a.createAnalyser) {
                throw options.throw.createAnalyser;
            }
            return new MockAnalyserNode_1.MockAnalyserNode(options.analyserNodeOptions);
        };
        class_1.prototype.createMediaElementSource = function () {
            var _a;
            if ((_a = options.throw) === null || _a === void 0 ? void 0 : _a.createMediaElementSource) {
                throw options.throw.createMediaElementSource;
            }
            return new MockMediaElementAudioSourceNode_1.MockMediaElementAudioSourceNode();
        };
        class_1.prototype.createMediaStreamDestination = function () {
            var _a;
            if ((_a = options.throw) === null || _a === void 0 ? void 0 : _a.createMediaStreamDestination) {
                throw options.throw.createMediaStreamDestination;
            }
            return new MockMediaStreamAudioDestinationNode_1.MockMediaStreamAudioDestinationNode();
        };
        class_1.prototype.createMediaStreamSource = function () {
            var _a;
            if ((_a = options.throw) === null || _a === void 0 ? void 0 : _a.createMediaStreamSource) {
                throw options.throw.createMediaStreamSource;
            }
            return new MockMediaStreamAudioSourceNode_1.MockMediaStreamAudioSourceNode();
        };
        return class_1;
    }());
};
//# sourceMappingURL=MockAudioContext.js.map