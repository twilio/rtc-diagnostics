"use strict";
/* tslint:disable only-arrow-functions */
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
var constants_1 = require("../../lib/constants");
var OutputTest_1 = require("../../lib/OutputTest");
var suiteTimeout = 10000;
var defaultTestDuration = 5000;
var defaultTestPollIntervalMs = 10;
describe('testOutputDevice', function () {
    this.timeout(suiteTimeout);
    describe('when not given a testURI', function () {
        describe('when allowed to time out', function () {
            var outputTestReport;
            var outputTestEvents = [];
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                    var test = OutputTest_1.testOutputDevice({
                                        duration: defaultTestDuration,
                                        passOnTimeout: false,
                                        pollIntervalMs: defaultTestPollIntervalMs,
                                    });
                                    test.on(OutputTest_1.OutputTest.Events.Volume, function () {
                                        outputTestEvents.push(OutputTest_1.OutputTest.Events.Volume);
                                    });
                                    test.on(OutputTest_1.OutputTest.Events.Error, function () {
                                        outputTestEvents.push(OutputTest_1.OutputTest.Events.Error);
                                    });
                                    test.on(OutputTest_1.OutputTest.Events.End, function (report) {
                                        outputTestEvents.push(OutputTest_1.OutputTest.Events.End);
                                        setTimeout(function () { return resolve(report); }, defaultTestPollIntervalMs * 3);
                                    });
                                })];
                            case 1:
                                outputTestReport = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should have failed', function () {
                assert.equal(outputTestReport.didPass, false);
            });
            it('should end with an `end` event', function () {
                assert.equal(outputTestEvents[outputTestEvents.length - 1], OutputTest_1.OutputTest.Events.End);
            });
        });
        describe('when stopped with `didPass` set to `true`', function () {
            var outputTestReport;
            var outputTestEvents = [];
            before(function () {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                    var timeoutId;
                                    var test = OutputTest_1.testOutputDevice({
                                        duration: Infinity,
                                        pollIntervalMs: defaultTestPollIntervalMs,
                                    });
                                    test.on(OutputTest_1.OutputTest.Events.Volume, function () {
                                        outputTestEvents.push(OutputTest_1.OutputTest.Events.Volume);
                                    });
                                    test.on(OutputTest_1.OutputTest.Events.End, function (report) {
                                        outputTestEvents.push(OutputTest_1.OutputTest.Events.End);
                                        clearTimeout(timeoutId);
                                        setTimeout(function () { return resolve(report); }, defaultTestPollIntervalMs * 3);
                                    });
                                    timeoutId = setTimeout(function () { return test.stop(true); }, defaultTestDuration);
                                })];
                            case 1:
                                outputTestReport = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should pass', function () {
                assert(outputTestReport.didPass);
            });
            it('should have some amount of `volume` events', function () {
                assert(outputTestEvents.filter(function (e) { return e === OutputTest_1.OutputTest.Events.Volume; }).length
                    > 0);
            });
            it('should end with an `end` event', function () {
                assert.equal(outputTestEvents[outputTestEvents.length - 1], OutputTest_1.OutputTest.Events.End);
            });
            it('should not have more than 1 `end` event', function () {
                assert.equal(outputTestEvents.filter(function (e) { return e === OutputTest_1.OutputTest.Events.End; }).length, 1);
            });
        });
    });
    describe('when stopped with `didPass` set to `false`', function () {
        var outputTestReport;
        var outputTestEvents = [];
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var timeoutId;
                                var test = OutputTest_1.testOutputDevice({
                                    duration: Infinity,
                                    pollIntervalMs: defaultTestPollIntervalMs,
                                });
                                test.on(OutputTest_1.OutputTest.Events.Volume, function () {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.Volume);
                                });
                                test.on(OutputTest_1.OutputTest.Events.End, function (report) {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.End);
                                    clearTimeout(timeoutId);
                                    setTimeout(function () { return resolve(report); }, defaultTestPollIntervalMs * 3);
                                });
                                timeoutId = setTimeout(function () { return test.stop(false); }, defaultTestDuration);
                            })];
                        case 1:
                            outputTestReport = _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('should not pass', function () {
            assert.equal(outputTestReport.didPass, false);
        });
    });
    describe('when given a valid `testURI`', function () {
        var outputTestReport;
        var outputTestEvents = [];
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var timeoutId;
                                var test = OutputTest_1.testOutputDevice({
                                    duration: Infinity,
                                    pollIntervalMs: defaultTestPollIntervalMs,
                                    testURI: constants_1.INCOMING_SOUND_URL,
                                });
                                test.on(OutputTest_1.OutputTest.Events.Volume, function () {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.Volume);
                                });
                                test.on(OutputTest_1.OutputTest.Events.End, function (report) {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.End);
                                    clearTimeout(timeoutId);
                                    setTimeout(function () { return resolve(report); }, defaultTestPollIntervalMs * 3);
                                });
                                test.on(OutputTest_1.OutputTest.Events.Error, function () {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.Error);
                                });
                                timeoutId = setTimeout(function () { return test.stop(true); }, defaultTestDuration);
                            })];
                        case 1:
                            outputTestReport = _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('should not have any errors', function () {
            assert.equal(outputTestReport.errors.length, 0);
        });
        it('should load the audio and pass', function () {
            assert(outputTestReport.didPass);
        });
    });
    describe('when given an invalid `testURI`', function () {
        var outputTestReport;
        var outputTestEvents = [];
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                var test = OutputTest_1.testOutputDevice({
                                    duration: Infinity,
                                    pollIntervalMs: defaultTestPollIntervalMs,
                                    testURI: '',
                                });
                                test.on(OutputTest_1.OutputTest.Events.Volume, function () {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.Volume);
                                });
                                test.on(OutputTest_1.OutputTest.Events.End, function (report) {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.End);
                                    setTimeout(function () { return resolve(report); }, defaultTestPollIntervalMs * 3);
                                });
                                test.on(OutputTest_1.OutputTest.Events.Error, function () {
                                    outputTestEvents.push(OutputTest_1.OutputTest.Events.Error);
                                });
                            })];
                        case 1:
                            outputTestReport = _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('should not have a "no supported source was found" error', function () {
            assert.equal(outputTestReport.errors.length, 1);
            var error = outputTestReport.errors[0].domError;
            assert(error);
            assert.equal(error.name, 'NotSupportedError');
        });
    });
});
//# sourceMappingURL=OutputTest.js.map