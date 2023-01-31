"use strict";
// tslint:disable only-arrow-functions
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var sinon = require("sinon");
var errors_1 = require("../../lib/errors");
var VideoInputTest_1 = require("../../lib/VideoInputTest");
var mockGetUserMedia_1 = require("../mocks/mockGetUserMedia");
var MockHTMLMediaElement_1 = require("../mocks/MockHTMLMediaElement");
var MockMediaStream_1 = require("../mocks/MockMediaStream");
var MockTrack_1 = require("../mocks/MockTrack");
function createTestOptions(overrides) {
    if (overrides === void 0) { overrides = {}; }
    return __assign({ duration: 1000, getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
            mediaStream: new MockMediaStream_1.MockMediaStream({
                tracks: [new MockTrack_1.MockTrack({ kind: 'video' })],
            }),
        }) }, overrides);
}
describe('testVideoInputDevice', function () {
    var clock;
    before(function () {
        clock = sinon.useFakeTimers();
    });
    after(function () {
        sinon.restore();
    });
    function createBasicTest(testOptions) {
        var _a;
        var handlers = (_a = {},
            _a[VideoInputTest_1.VideoInputTest.Events.End] = sinon.stub(),
            _a[VideoInputTest_1.VideoInputTest.Events.Error] = sinon.stub(),
            _a);
        var videoInputTest = VideoInputTest_1.testVideoInputDevice(testOptions);
        videoInputTest.on(VideoInputTest_1.VideoInputTest.Events.Error, handlers.error);
        videoInputTest.on(VideoInputTest_1.VideoInputTest.Events.End, handlers.end);
        var resetHandlers = function () { return Object.values(handlers).forEach(function (handler) { return handler.reset(); }); };
        return {
            handlers: handlers,
            resetHandlers: resetHandlers,
            videoInputTest: videoInputTest,
        };
    }
    it('should throw if passed invalid options', function () {
        return __awaiter(this, void 0, void 0, function () {
            var invalidOptions, _i, invalidOptions_1, overrides, options, handlers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidOptions = [{
                                deviceId: 0,
                            }, {
                                deviceId: {},
                            }, {
                                duration: -10,
                            }, {
                                duration: {},
                            }];
                        _i = 0, invalidOptions_1 = invalidOptions;
                        _a.label = 1;
                    case 1:
                        if (!(_i < invalidOptions_1.length)) return [3 /*break*/, 4];
                        overrides = invalidOptions_1[_i];
                        options = createTestOptions(overrides);
                        handlers = createBasicTest(options).handlers;
                        return [4 /*yield*/, clock.runAllAsync()];
                    case 2:
                        _a.sent();
                        assert(handlers.end.calledOnce);
                        assert(handlers.error.calledOnce);
                        assert(handlers.end.calledAfter(handlers.error));
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    });
    it('should warn if stopped multiple times', function () {
        return __awaiter(this, void 0, void 0, function () {
            var consoleStub, options, test_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        consoleStub = sinon.stub(console, 'warn');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 2, 4]);
                        options = createTestOptions({ debug: true });
                        test_1 = VideoInputTest_1.testVideoInputDevice(options);
                        test_1.stop();
                        test_1.stop();
                        assert(consoleStub.calledOnce);
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, clock.runAllAsync()];
                    case 3:
                        _a.sent();
                        consoleStub.restore();
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    });
    describe('in a supported environment', function () {
        describe('when `getUserMedia` returns a valid stream', function () {
            var errorHandler;
            var endHandler;
            var trackStub;
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    var track, options, handlers;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                track = new MockTrack_1.MockTrack({ kind: 'video' });
                                trackStub = sinon.stub(track, 'stop');
                                options = createTestOptions({
                                    getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
                                        mediaStream: new MockMediaStream_1.MockMediaStream({
                                            tracks: [track],
                                        }),
                                    }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                endHandler = handlers.end;
                                errorHandler = handlers.error;
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should not have emitted any error event', function () {
                assert(errorHandler.notCalled);
            });
            it('should generate a valid report', function () {
                assert(endHandler.calledOnce);
                var report = endHandler.args[0][0];
                assert(report);
            });
            it('should have cleaned up the stream', function () {
                assert(trackStub.calledOnce);
            });
        });
        describe('when a video element is provided', function () {
            var errorHandler;
            var endHandler;
            var pauseStub;
            var playStub;
            var setSrcObjectStub;
            var setSrcStub;
            var loadStub;
            var mediaStream;
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    var element, options, handlers;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                element = new MockHTMLMediaElement_1.MockHTMLMediaElement();
                                pauseStub = sinon.stub(element, 'pause');
                                playStub = sinon.stub(element, 'play').resolves();
                                loadStub = sinon.stub(element, 'load');
                                setSrcObjectStub = sinon.stub();
                                sinon.stub(element, 'srcObject').set(setSrcObjectStub);
                                setSrcStub = sinon.stub();
                                sinon.stub(element, 'src').set(setSrcStub);
                                mediaStream = new MockMediaStream_1.MockMediaStream({
                                    tracks: [new MockTrack_1.MockTrack({ kind: 'video' })],
                                });
                                options = createTestOptions({
                                    element: element,
                                    getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
                                        mediaStream: mediaStream,
                                    }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                endHandler = handlers.end;
                                errorHandler = handlers.error;
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should have ended successfully', function () {
                assert(endHandler.calledOnce);
                assert(errorHandler.notCalled);
            });
            it('should have called play on the element', function () {
                assert(playStub.calledOnce);
            });
            it('should have set the src object to the stream', function () {
                assert.equal(setSrcObjectStub.args[0][0], mediaStream);
            });
            it('should clean up the element', function () {
                assert(pauseStub.calledAfter(playStub));
                assert(pauseStub.calledOnce);
                assert.equal(setSrcObjectStub.args[1][0], null);
                assert(setSrcObjectStub.calledAfter(pauseStub));
                assert(setSrcStub.calledOnce);
                assert.equal(setSrcStub.args[0][0], '');
                assert(setSrcStub.calledAfter(pauseStub));
                assert(loadStub.calledOnce);
                assert(loadStub.calledAfter(setSrcStub));
                assert(loadStub.calledAfter(setSrcObjectStub));
            });
        });
    });
    describe('in an unsupported environment', function () {
        describe('it should immediately end and report an error', function () {
            [[
                    'getUserMedia', createTestOptions({ getUserMedia: undefined }),
                ]].forEach(function (_a) {
                var title = _a[0], options = _a[1];
                it("when " + title + " is not supported", function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var handlers, endHandler, errorHandler, report;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    handlers = createBasicTest(options).handlers;
                                    return [4 /*yield*/, clock.runAllAsync()];
                                case 1:
                                    _a.sent();
                                    endHandler = handlers.end;
                                    errorHandler = handlers.error;
                                    assert(endHandler.calledOnce);
                                    report = endHandler.args[0][0];
                                    assert(report);
                                    assert(errorHandler.calledOnce);
                                    assert(errorHandler.calledBefore(endHandler));
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
            });
        });
    });
    it('`testTiming` should not be in the report if gUM throws', function () {
        return __awaiter(this, void 0, void 0, function () {
            var options, handlers, handledError, report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = createTestOptions({
                            getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({ throw: new errors_1.DiagnosticError() }),
                        });
                        handlers = createBasicTest(options).handlers;
                        return [4 /*yield*/, clock.runAllAsync()];
                    case 1:
                        _a.sent();
                        assert(handlers.end.calledOnce);
                        assert(handlers.error.calledOnce);
                        assert(handlers.end.calledAfter(handlers.error));
                        handledError = handlers.error.args[0][0];
                        report = handlers.end.args[0][0];
                        assert.equal(report.errors.length, 1);
                        assert.equal(handledError, report.errors[0]);
                        assert(!('testTiming' in report));
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('should handle when an error is thrown during the test', function () {
        [[
                'getUserMedia', createTestOptions({
                    getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
                        throw: new errors_1.DiagnosticError(),
                    }),
                }),
            ]].forEach(function (_a) {
            var title = _a[0], options = _a[1];
            it("by " + title, function () {
                return __awaiter(this, void 0, void 0, function () {
                    var handlers, report;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                assert(handlers.end.calledOnce);
                                report = handlers.end.args[0][0];
                                assert(report);
                                assert(handlers.error.calledOnce);
                                assert(handlers.error.calledBefore(handlers.end));
                                return [2 /*return*/];
                        }
                    });
                });
            });
        });
        [[
                'DiagnosticError', new errors_1.DiagnosticError(),
            ], [
                'DOMException', new global.DOMException(),
            ], [
                'DOMError', new global.DOMError(),
            ], [
                'Error', new Error(),
            ], [
                'unknown error', {},
            ]].forEach(function (_a) {
            var title = _a[0], error = _a[1];
            it("of type " + title, function () {
                return __awaiter(this, void 0, void 0, function () {
                    var options, handlers, handledError, report;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                options = createTestOptions({
                                    getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({ throw: error }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                assert(handlers.end.calledOnce);
                                assert(handlers.error.calledOnce);
                                assert(handlers.end.calledAfter(handlers.error));
                                handledError = handlers.error.args[0][0];
                                report = handlers.end.args[0][0];
                                assert.equal(report.errors.length, 1);
                                assert.equal(handledError, report.errors[0]);
                                assert(!('testTiming' in report));
                                return [2 /*return*/];
                        }
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=VideoInputTest.js.map