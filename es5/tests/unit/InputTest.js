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
var constants_1 = require("../../lib/constants");
var DiagnosticError_1 = require("../../lib/errors/DiagnosticError");
var InputTest_1 = require("../../lib/InputTest");
var MockAudioContext_1 = require("../mocks/MockAudioContext");
var mockEnumerateDevices_1 = require("../mocks/mockEnumerateDevices");
var mockGetUserMedia_1 = require("../mocks/mockGetUserMedia");
var MockMediaStream_1 = require("../mocks/MockMediaStream");
var MockTrack_1 = require("../mocks/MockTrack");
function createTestOptions(overrides) {
    if (overrides === void 0) { overrides = {}; }
    return __assign({ audioContextFactory: MockAudioContext_1.mockAudioContextFactory(), duration: 1000, enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audioinput' }],
        }), getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
            mediaStream: new MockMediaStream_1.MockMediaStream({
                tracks: [new MockTrack_1.MockTrack()],
            }),
        }), volumeEventIntervalMs: 100 }, overrides);
}
describe('testInputDevice', function () {
    var _this = this;
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
            _a[InputTest_1.InputTest.Events.End] = sinon.stub(),
            _a[InputTest_1.InputTest.Events.Error] = sinon.stub(),
            _a[InputTest_1.InputTest.Events.Volume] = sinon.stub(),
            _a[InputTest_1.InputTest.Events.Warning] = sinon.stub(),
            _a[InputTest_1.InputTest.Events.WarningCleared] = sinon.stub(),
            _a);
        var inputTest = InputTest_1.testInputDevice(testOptions);
        inputTest.on(InputTest_1.InputTest.Events.Error, handlers.error);
        inputTest.on(InputTest_1.InputTest.Events.Volume, handlers.volume);
        inputTest.on(InputTest_1.InputTest.Events.End, handlers.end);
        inputTest.on(InputTest_1.InputTest.Events.WarningCleared, handlers['warning-cleared']);
        inputTest.on(InputTest_1.InputTest.Events.Warning, handlers.warning);
        var resetHandlers = function () { return Object.values(handlers).forEach(function (handler) { return handler.reset(); }); };
        return {
            handlers: handlers,
            inputTest: inputTest,
            resetHandlers: resetHandlers,
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
                            }, {
                                volumeEventIntervalMs: -10,
                            }, {
                                volumeEventIntervalMs: {},
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
                        assert(handlers.volume.notCalled);
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
                        test_1 = InputTest_1.testInputDevice(options);
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
        it('should properly warn the user when low audio levels should be detected', function () {
            return __awaiter(this, void 0, void 0, function () {
                var testOptions, _a, handlers, inputTest, resetHandlers, original;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            testOptions = createTestOptions({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                    analyserNodeOptions: { volumeValues: 0 },
                                }),
                                duration: Infinity,
                            });
                            _a = createBasicTest(testOptions), handlers = _a.handlers, inputTest = _a.inputTest, resetHandlers = _a.resetHandlers;
                            return [4 /*yield*/, clock.tickAsync(5000)];
                        case 1:
                            _b.sent();
                            assert(handlers.error.notCalled);
                            assert(handlers.volume.called);
                            assert(handlers.volume.args.every(function (_a) {
                                var v = _a[0];
                                return v === 0;
                            }));
                            assert(handlers.end.notCalled);
                            assert(handlers.warning.calledOnce);
                            assert(handlers.warning.args[0][0] === constants_1.WarningName.LowAudioLevel);
                            resetHandlers();
                            original = inputTest['_onVolume'].bind(inputTest);
                            inputTest['_onVolume'] = function () {
                                original(100);
                            };
                            return [4 /*yield*/, clock.tickAsync(5000)];
                        case 2:
                            _b.sent();
                            assert(handlers.volume.called);
                            assert(handlers.volume.args.every(function (_a) {
                                var v = _a[0];
                                return v === 100;
                            }));
                            assert(handlers.end.notCalled);
                            assert(handlers.warning.notCalled);
                            assert(handlers['warning-cleared'].calledOnce);
                            assert(handlers['warning-cleared'].args[0][0] === constants_1.WarningName.LowAudioLevel);
                            resetHandlers();
                            inputTest.stop();
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 3:
                            _b.sent();
                            [
                                handlers.volume,
                                handlers.error,
                                handlers.warning,
                                handlers['warning-cleared'],
                            ].forEach(function (h) {
                                assert(h.notCalled);
                            });
                            assert(handlers.end.calledOnce);
                            return [2 /*return*/];
                    }
                });
            });
        });
        describe('when all volume values are all 0', function () {
            var errorHandler;
            var volumeHandler;
            var endHandler;
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    var options, handlers;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                options = createTestOptions({
                                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                        analyserNodeOptions: { volumeValues: 0 },
                                    }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                endHandler = handlers.end;
                                errorHandler = handlers.error;
                                volumeHandler = handlers.volume;
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should not have emitted any error event', function () {
                assert(errorHandler.notCalled);
            });
            it('should have emitted at least one volume event', function () {
                assert(volumeHandler.called);
            });
            it('should generate a valid report', function () {
                assert(endHandler.calledOnce);
                var report = endHandler.args[0][0];
                assert(report);
                assert(!report.didPass);
                assert.equal(report.values.length, volumeHandler.callCount);
                assert(report.values.every(function (v) { return v === 0; }));
            });
        });
        describe('when all volume values are all 100', function () {
            var errorHandler;
            var volumeHandler;
            var endHandler;
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    var options, handlers;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                options = createTestOptions({
                                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                        analyserNodeOptions: { volumeValues: 100 },
                                    }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                endHandler = handlers.end;
                                errorHandler = handlers.error;
                                volumeHandler = handlers.volume;
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should not have emitted any error event', function () {
                assert(errorHandler.notCalled);
            });
            it('should have emitted at least one volume event', function () {
                assert(volumeHandler.called);
            });
            it('should generate a valid report', function () {
                assert(endHandler.calledOnce);
                var report = endHandler.args[0][0];
                assert(report);
                assert(report.didPass);
                assert.equal(report.values.length, volumeHandler.callCount);
                assert(report.values.every(function (v) { return v === 100; }));
            });
        });
    });
    describe('in an unsupported environment', function () {
        describe('it should immediately end and report an error', function () {
            [[
                    'AudioContext', createTestOptions({ audioContextFactory: undefined }),
                ], [
                    'getUserMedia', createTestOptions({ getUserMedia: undefined }),
                ], [
                    'enumerateDevices', createTestOptions({ enumerateDevices: undefined }),
                ]].forEach(function (_a) {
                var title = _a[0], options = _a[1];
                it("when " + title + " is not supported", function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var handlers, endHandler, errorHandler, volumeHandler, report;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    handlers = createBasicTest(options).handlers;
                                    return [4 /*yield*/, clock.runAllAsync()];
                                case 1:
                                    _a.sent();
                                    endHandler = handlers.end;
                                    errorHandler = handlers.error;
                                    volumeHandler = handlers.volume;
                                    assert(endHandler.calledOnce);
                                    report = endHandler.args[0][0];
                                    assert(report);
                                    assert(!report.didPass);
                                    assert(errorHandler.calledOnce);
                                    assert(errorHandler.calledBefore(endHandler));
                                    assert(volumeHandler.notCalled);
                                    return [2 /*return*/];
                            }
                        });
                    });
                });
            });
        });
    });
    describe('should handle when an error is thrown during the test', function () {
        [[
                'AudioContext', createTestOptions({
                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                        throw: { construction: new DiagnosticError_1.DiagnosticError() },
                    }),
                }),
            ], [
                'getUserMedia', createTestOptions({
                    getUserMedia: mockGetUserMedia_1.mockGetUserMediaFactory({
                        throw: new DiagnosticError_1.DiagnosticError(),
                    }),
                }),
            ], [
                'enumerateDevices', createTestOptions({
                    enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                        devices: [],
                        throw: new DiagnosticError_1.DiagnosticError(),
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
                                assert(!report.didPass);
                                assert(handlers.error.calledOnce);
                                assert(handlers.error.calledBefore(handlers.end));
                                assert(handlers.volume.notCalled);
                                return [2 /*return*/];
                        }
                    });
                });
            });
        });
        [[
                'DiagnosticError', new DiagnosticError_1.DiagnosticError(),
            ], [
                'DOMException', new global.DOMException(),
            ], [
                'DOMError', new global.DOMError(),
            ], [
                'unknown error', new Error(),
            ]].forEach(function (_a) {
            var title = _a[0], error = _a[1];
            it("of type " + title, function () {
                return __awaiter(this, void 0, void 0, function () {
                    var options, handlers, handledError, report;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                options = createTestOptions({
                                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                        throw: { construction: error },
                                    }),
                                });
                                handlers = createBasicTest(options).handlers;
                                return [4 /*yield*/, clock.runAllAsync()];
                            case 1:
                                _a.sent();
                                assert(handlers.end.calledOnce);
                                assert(handlers.error.calledOnce);
                                assert(handlers.end.calledAfter(handlers.error));
                                assert(handlers.volume.notCalled);
                                handledError = handlers.error.args[0][0];
                                report = handlers.end.args[0][0];
                                assert(!report.didPass);
                                assert.equal(report.errors.length, 1);
                                assert.equal(handledError, report.errors[0]);
                                return [2 /*return*/];
                        }
                    });
                });
            });
        });
    });
    describe('audio recording', function () {
        var initCallback;
        var audioRecorderFactory;
        beforeEach(function () {
            initCallback = sinon.stub();
            audioRecorderFactory = function () {
                initCallback();
                this.stop = function () { return Promise.resolve(); };
                this.url = 'foo';
            };
        });
        describe('when enableRecording is false', function () {
            it('should not initialize AudioRecorder by default', function () { return __awaiter(_this, void 0, void 0, function () {
                var options;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            options = createTestOptions({
                                audioRecorderFactory: audioRecorderFactory,
                            });
                            createBasicTest(options);
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 1:
                            _a.sent();
                            sinon.assert.notCalled(initCallback);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should not initialize AudioRecorder if enableRecording is explicitly set to false', function () { return __awaiter(_this, void 0, void 0, function () {
                var options;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            options = createTestOptions({
                                audioRecorderFactory: audioRecorderFactory,
                                enableRecording: false,
                            });
                            createBasicTest(options);
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 1:
                            _a.sent();
                            sinon.assert.notCalled(initCallback);
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should not include recording url in the report', function () { return __awaiter(_this, void 0, void 0, function () {
                var options, handlers, report;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            options = createTestOptions({
                                audioRecorderFactory: audioRecorderFactory,
                                enableRecording: false,
                            });
                            handlers = createBasicTest(options).handlers;
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 1:
                            _a.sent();
                            report = handlers.end.args[0][0];
                            assert(!report.recordingUrl);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe('when enableRecording is true', function () {
            var report;
            beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
                var options, handlers;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            options = createTestOptions({
                                audioRecorderFactory: audioRecorderFactory,
                                enableRecording: true,
                            });
                            handlers = createBasicTest(options).handlers;
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 1:
                            _a.sent();
                            report = handlers.end.args[0][0];
                            return [2 /*return*/];
                    }
                });
            }); });
            it('should initialize AudioRecorder', function () {
                sinon.assert.calledOnce(initCallback);
            });
            it('should set report.recordingUrl', function () {
                assert.equal(report.recordingUrl, 'foo');
            });
            it('should fail if audio recorder fails', function () { return __awaiter(_this, void 0, void 0, function () {
                var options, handlers;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            audioRecorderFactory = function () {
                                initCallback();
                                this.stop = function () { return Promise.reject('foo-error'); };
                                this.url = 'foo';
                            };
                            options = createTestOptions({
                                audioRecorderFactory: audioRecorderFactory,
                                enableRecording: true,
                            });
                            handlers = createBasicTest(options).handlers;
                            return [4 /*yield*/, clock.runAllAsync()];
                        case 1:
                            _a.sent();
                            report = handlers.end.args[0][0];
                            sinon.assert.calledOnce(handlers.error);
                            assert(!report.recordingUrl);
                            assert(!report.didPass);
                            assert.equal(report.errors.length, 1);
                            assert.equal(report.errors[0], 'foo-error');
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=InputTest.js.map