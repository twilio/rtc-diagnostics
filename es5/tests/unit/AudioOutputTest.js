"use strict";
// tslint:disable only-arrow-functions
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
var AudioOutputTest_1 = require("../../lib/AudioOutputTest");
var constants_1 = require("../../lib/constants");
var DiagnosticError_1 = require("../../lib/errors/DiagnosticError");
var MockAudioContext_1 = require("../mocks/MockAudioContext");
var MockAudioElement_1 = require("../mocks/MockAudioElement");
var mockEnumerateDevices_1 = require("../mocks/mockEnumerateDevices");
var defaultDuration = 100;
var defaultVolumeEventIntervalMs = 1;
describe('testAudioOutputDevice', function () {
    var audioElementFactory = MockAudioElement_1.mockAudioElementFactory({
        supportSetSinkId: true,
    });
    var volumeValues = 100;
    describe("with volume values of " + volumeValues, function () {
        var report;
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                AudioOutputTest_1.testAudioOutputDevice({
                                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                        analyserNodeOptions: { volumeValues: volumeValues },
                                    }),
                                    audioElementFactory: audioElementFactory,
                                    duration: defaultDuration,
                                    enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                        devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                    }),
                                    volumeEventIntervalMs: defaultVolumeEventIntervalMs,
                                }).on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                            })];
                        case 1:
                            report = _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('timestamps should be set', function () {
            assert(report.testTiming);
            assert(report.testTiming.duration);
            assert(report.testTiming.end);
            assert(report.testTiming.start);
        });
        it("all volume values should be " + volumeValues, function () {
            assert(report.values.every(function (v) { return v === volumeValues; }));
        });
    });
    describe('with volume values of 0', function () {
        var report;
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                var audioContextFactory;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            audioContextFactory = MockAudioContext_1.mockAudioContextFactory({
                                analyserNodeOptions: { volumeValues: 0 },
                            });
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    AudioOutputTest_1.testAudioOutputDevice({
                                        audioContextFactory: audioContextFactory,
                                        audioElementFactory: audioElementFactory,
                                        duration: defaultDuration,
                                        enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                            devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                        }),
                                        volumeEventIntervalMs: defaultVolumeEventIntervalMs,
                                    }).on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                                })];
                        case 1:
                            report = _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('timestamps should be set', function () {
            assert(report.testTiming);
            assert(report.testTiming.duration);
            assert(report.testTiming.end);
            assert(report.testTiming.start);
        });
        it('all volume values should be 0', function () {
            assert(report.values.every(function (v) { return v === 0; }));
        });
    });
    it('should report if stopped normally', function () {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                    analyserNodeOptions: { volumeValues: volumeValues },
                                }),
                                audioElementFactory: audioElementFactory,
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                }),
                                volumeEventIntervalMs: defaultVolumeEventIntervalMs,
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve);
                            setTimeout(function () {
                                test.stop();
                            }, defaultDuration);
                        })];
                    case 1:
                        report = _a.sent();
                        assert(report);
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should report the default device if not passing in a deviceId', function () {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                audioElementFactory: audioElementFactory,
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [{
                                            deviceId: 'foo',
                                            kind: 'audiooutput',
                                        }, {
                                            deviceId: 'bar',
                                            kind: 'audiooutput',
                                        }],
                                }),
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve);
                            setTimeout(function () {
                                test.stop();
                            }, defaultDuration);
                        })];
                    case 1:
                        report = _a.sent();
                        assert(report);
                        assert.equal(report.deviceId, 'foo');
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should report the passed device if passing in a deviceId', function () {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                audioElementFactory: audioElementFactory,
                                deviceId: 'bar',
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [{
                                            deviceId: 'foo',
                                            kind: 'audiooutput',
                                        }, {
                                            deviceId: 'bar',
                                            kind: 'audiooutput',
                                        }],
                                }),
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve);
                            setTimeout(function () {
                                test.stop();
                            }, defaultDuration);
                        })];
                    case 1:
                        report = _a.sent();
                        assert(report);
                        assert.equal(report.deviceId, 'bar');
                        return [2 /*return*/];
                }
            });
        });
    });
    describe('should immediately end and report an error', function () {
        // not providing the mock object here results in the test resorting to the
        // global
        // because these are unit tests, and node does not have these globals,
        // they are null and are essentially "not supported"
        it('when AudioContext is not supported', function () {
            return __awaiter(this, void 0, void 0, function () {
                var report, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var test = AudioOutputTest_1.testAudioOutputDevice({
                                    audioElementFactory: audioElementFactory,
                                    enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                        devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                    }),
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function () {
                                    // do nothing, prevent rejection
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                            })];
                        case 1:
                            report = _a.sent();
                            assert(report);
                            assert.equal(report.errors.length, 1);
                            error = report.errors[0];
                            assert(error instanceof DiagnosticError_1.DiagnosticError);
                            assert.equal(error.name, constants_1.ErrorName.UnsupportedError);
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('when Audio is not supported', function () {
            return __awaiter(this, void 0, void 0, function () {
                var report, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var test = AudioOutputTest_1.testAudioOutputDevice({
                                    audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                    enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                        devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                    }),
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function () {
                                    // do nothing, prevent rejection
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                            })];
                        case 1:
                            report = _a.sent();
                            assert(report);
                            assert.equal(report.errors.length, 1);
                            error = report.errors[0];
                            assert(error instanceof DiagnosticError_1.DiagnosticError);
                            assert.equal(error.name, constants_1.ErrorName.UnsupportedError);
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('when neither AudioContext or Audio is supported', function () {
            return __awaiter(this, void 0, void 0, function () {
                var report, error;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var test = AudioOutputTest_1.testAudioOutputDevice({
                                    enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                        devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                    }),
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function () {
                                    // do nothing, prevent rejection
                                });
                                test.on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                            })];
                        case 1:
                            report = _a.sent();
                            assert(report);
                            assert.equal(report.errors.length, 1);
                            error = report.errors[0];
                            assert(error instanceof DiagnosticError_1.DiagnosticError);
                            assert.equal(error.name, constants_1.ErrorName.UnsupportedError);
                            return [2 /*return*/];
                    }
                });
            });
        });
    });
    it('should warn if stopped twice', function () {
        var stub = sinon.stub(console, 'warn');
        var test = AudioOutputTest_1.testAudioOutputDevice({
            audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                analyserNodeOptions: { volumeValues: 100 },
            }),
            audioElementFactory: audioElementFactory,
            debug: true,
            enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                devices: [{ deviceId: 'default', kind: 'audiooutput' }],
            }),
        });
        test.stop();
        test.stop();
        assert(stub.callCount);
        stub.restore();
    });
    [
        [new DiagnosticError_1.DiagnosticError(), 'DiagnosticError'],
        [new global.DOMError(), 'DOMError'],
        [new global.DOMException(), 'DOMException'],
        [new Error(), 'an unknown error'],
    ].forEach(function (_a) {
        var error = _a[0], name = _a[1];
        describe("should handle " + name, function () {
            var report;
            beforeEach(function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                    var test = AudioOutputTest_1.testAudioOutputDevice({
                                        audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                            throw: { construction: error },
                                        }),
                                        audioElementFactory: audioElementFactory,
                                        duration: defaultDuration,
                                        enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                            devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                                        }),
                                        volumeEventIntervalMs: defaultVolumeEventIntervalMs,
                                    });
                                    test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function () { });
                                    test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve);
                                })];
                            case 1:
                                report = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should report an error', function () {
                var _a;
                assert(report);
                assert.equal((_a = report) === null || _a === void 0 ? void 0 : _a.errors.length, 1);
            });
            afterEach(function () {
                report = undefined;
            });
        });
    });
    it('should allow `deviceId` if `setSinkId` is supported', function () {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory({
                                    analyserNodeOptions: { volumeValues: 100 },
                                }),
                                audioElementFactory: audioElementFactory,
                                deviceId: 'foobar',
                                duration: defaultDuration,
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [{ deviceId: 'foobar', kind: 'audiooutput' }],
                                }),
                                volumeEventIntervalMs: defaultVolumeEventIntervalMs,
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.End, function (r) { return resolve(r); });
                            test.stop();
                        })];
                    case 1:
                        report = _a.sent();
                        assert(report);
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should not allow `deviceId` if `setSinkId` is unsupported', function () {
        return __awaiter(this, void 0, void 0, function () {
            var test, results, error, report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        test = AudioOutputTest_1.testAudioOutputDevice({
                            audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                            audioElementFactory: MockAudioElement_1.mockAudioElementFactory({ supportSetSinkId: false }),
                            deviceId: 'foobar',
                            enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                devices: [{ deviceId: 'foobar', kind: 'audiooutput' }],
                            }),
                        });
                        return [4 /*yield*/, Promise.all([
                                new Promise(function (resolve) { return test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, resolve); }),
                                new Promise(function (resolve) { return test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve); }),
                            ])];
                    case 1:
                        results = _a.sent();
                        error = results[0];
                        report = results[1];
                        assert(error);
                        assert(report);
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should throw during setup when `enumerateDevices` is not supported', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, assert.rejects(function () { return new Promise(function (_, reject) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                audioElementFactory: audioElementFactory,
                                deviceId: 'foobar',
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function (err) { return reject(err); });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should throw during setup when there are no detected output devices', function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, assert.rejects(function () { return new Promise(function (_, reject) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                audioElementFactory: MockAudioElement_1.mockAudioElementFactory(),
                                deviceId: 'foobar',
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [],
                                }),
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function (err) { return reject(err); });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
    it('should throw `InvalidOptions` error if passed invalid options', function () {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            var test = AudioOutputTest_1.testAudioOutputDevice({
                                audioContextFactory: MockAudioContext_1.mockAudioContextFactory(),
                                audioElementFactory: MockAudioElement_1.mockAudioElementFactory(),
                                deviceId: {},
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: [{
                                            deviceId: 'foobar',
                                            groupId: 'biffbazz',
                                            kind: 'audioinput',
                                            label: 'test-device',
                                            toJSON: function () { return 'some-json'; },
                                        }],
                                }),
                            });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.Error, function () { });
                            test.on(AudioOutputTest_1.AudioOutputTest.Events.End, resolve);
                        })];
                    case 1:
                        report = _a.sent();
                        assert.equal(report.errors.length, 1);
                        assert(report.errors[0] instanceof DiagnosticError_1.DiagnosticError);
                        assert.equal(report.errors[0].name, constants_1.ErrorName.InvalidOptionsError);
                        return [2 /*return*/];
                }
            });
        });
    });
});
//# sourceMappingURL=AudioOutputTest.js.map