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
var sinon = require("sinon");
var InputTest_1 = require("../../lib/InputTest");
var defaultTestDuration = 500;
var defaultTestVolumeEventIntervalMs = 5;
describe('testInputDevice', function () {
    describe('with a deviceId', function () {
        var volumeHandler;
        var errorHandler;
        var endHandler;
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            volumeHandler = sinon.spy();
                            errorHandler = sinon.spy();
                            endHandler = sinon.spy();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    var test = InputTest_1.testInputDevice({
                                        debug: false,
                                        duration: defaultTestDuration,
                                        volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
                                    });
                                    test.on(InputTest_1.InputTest.Events.Error, errorHandler);
                                    test.on(InputTest_1.InputTest.Events.Volume, volumeHandler);
                                    test.on(InputTest_1.InputTest.Events.End, function (r) {
                                        endHandler(r);
                                        // we want to wait before resolving so we can detect if the end handler
                                        // has been called multiple times
                                        setTimeout(function () { return resolve(); }, defaultTestVolumeEventIntervalMs * 3);
                                    });
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('should have called the volume handler more than once', function () {
            assert(volumeHandler.callCount > 1);
        });
        it('should have not called the error handler', function () {
            assert(!errorHandler.called);
        });
        it('should have called the end handler once', function () {
            assert(endHandler.callCount === 1);
        });
        it('should have generated a valid report', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert('deviceId' in report);
            assert('errors' in report);
            assert.equal(report.errors.length, 0);
            assert('testTiming' in report);
            assert('start' in report.testTiming);
            assert('end' in report.testTiming);
            assert('didPass' in report);
            assert('testName' in report);
            assert(report.testName === InputTest_1.InputTest.testName);
            assert('values' in report);
        });
        it('should contain the same amount of volume values as there were volume events', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert.equal(report.values.length, volumeHandler.callCount);
        });
        it('should not contain any errors', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert('errors' in report);
            assert.equal(report.errors.length, 0);
        });
        afterEach(function () {
            sinon.restore();
        });
    });
    describe('without a deviceId', function () {
        var volumeHandler;
        var errorHandler;
        var endHandler;
        beforeEach(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            volumeHandler = sinon.spy();
                            errorHandler = sinon.spy();
                            endHandler = sinon.spy();
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    var test = InputTest_1.testInputDevice({
                                        debug: false,
                                        duration: defaultTestDuration,
                                        volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
                                    });
                                    test.on(InputTest_1.InputTest.Events.Error, errorHandler);
                                    test.on(InputTest_1.InputTest.Events.Volume, volumeHandler);
                                    test.on(InputTest_1.InputTest.Events.End, function (r) {
                                        endHandler(r);
                                        // we want to wait before resolving so we can detect if the end handler
                                        // has been called multiple times
                                        setTimeout(function () { return resolve(); }, defaultTestVolumeEventIntervalMs * 3);
                                    });
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('should have called the volume handler more than once', function () {
            assert(volumeHandler.callCount > 1);
        });
        it('should have not called the error handler', function () {
            assert(!errorHandler.called);
        });
        it('should have called the end handler once', function () {
            assert(endHandler.callCount === 1);
        });
        it('should have generated a valid report', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert('deviceId' in report);
            assert('errors' in report);
            assert.equal(report.errors.length, 0);
            assert('testTiming' in report);
            assert('start' in report.testTiming);
            assert('end' in report.testTiming);
            assert('didPass' in report);
            assert('testName' in report);
            assert(report.testName === InputTest_1.InputTest.testName);
            assert('values' in report);
        });
        it('should contain the same amount of volume values as there were volume events', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert.equal(report.values.length, volumeHandler.callCount);
        });
        it('should not contain any errors', function () {
            var report = endHandler.args[0][0];
            assert(report);
            assert('errors' in report);
            assert.equal(report.errors.length, 0);
        });
        afterEach(function () {
            sinon.restore();
        });
    });
});
//# sourceMappingURL=InputTest.js.map