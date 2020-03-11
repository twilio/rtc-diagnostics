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
var errors_1 = require("../../../lib/errors");
var optionValidation_1 = require("../../../lib/utils/optionValidation");
var mockEnumerateDevices_1 = require("../../mocks/mockEnumerateDevices");
describe('OptionValidation', function () {
    describe('validateTime', function () {
        it('should return an invalidity string if the time is negative', function () {
            var shouldBeString = optionValidation_1.validateTime(-1);
            assert.equal(typeof shouldBeString, 'string');
        });
        it('should return `undefined` if the time is valid', function () {
            var shouldBeUndefined = optionValidation_1.validateTime(0);
            assert.equal(typeof shouldBeUndefined, 'undefined');
            var shouldAlsoBeUndefined = optionValidation_1.validateTime(1);
            assert.equal(typeof shouldAlsoBeUndefined, 'undefined');
        });
    });
    describe('AudioDeviceValidator', function () {
        describe('createAudioDeviceValidator', function () {
            describe('when not given any options', function () {
                var validator;
                before(function () {
                    validator = optionValidation_1.createAudioDeviceValidator();
                });
                it('should return a function', function () {
                    assert.equal(typeof validator, 'function');
                });
                it('should throw an `DiagnosticError`', function () {
                    return __awaiter(this, void 0, void 0, function () {
                        var error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, validator('foobar')];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    assert(error_1 instanceof errors_1.DiagnosticError);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    });
                });
            });
            describe('when given some options', function () {
                var mockOptions = [{
                        deviceId: undefined,
                        devices: [],
                        expected: 'No audio devices available.',
                        title: 'when it returns no devices',
                    }, {
                        deviceId: undefined,
                        devices: [{ deviceId: 'default' }],
                        expected: undefined,
                        title: 'when it has a default device',
                    }, {
                        deviceId: undefined,
                        devices: [{ deviceId: 'default', kind: 'audioinput' }],
                        expected: undefined,
                        kind: 'audioinput',
                        title: 'when looking for a specific kind that is available',
                    }, {
                        deviceId: undefined,
                        devices: [{ deviceId: 'default', kind: 'audiooutput' }],
                        expected: "No devices found with the correct kind \"audioinput\".",
                        kind: 'audioinput',
                        title: 'when looking for a specific kind that is not available',
                    }, {
                        deviceId: 'foobar',
                        devices: [{ deviceId: 'default' }],
                        expected: "Device ID \"foobar\" not found within list of available devices.",
                        title: 'when looking for a id that is not available',
                    }, {
                        deviceId: 'foobar',
                        devices: [
                            { deviceId: 'foobar', kind: 'audiooutput' },
                            { deviceId: 'barfoo', kind: 'audioinput' },
                        ],
                        expected: "Device ID \"foobar\" is not the correct \"kind\","
                            + " expected \"audioinput\".",
                        kind: 'audioinput',
                        title: 'when looking for a id that is available but not the correct kind',
                    }];
                mockOptions.forEach(function (options) {
                    describe(options.title, function () {
                        var validator;
                        before(function () {
                            validator = optionValidation_1.createAudioDeviceValidator({
                                enumerateDevices: mockEnumerateDevices_1.mockEnumerateDevicesFactory({
                                    devices: options.devices,
                                }),
                                kind: options.kind,
                            });
                        });
                        it('should return a function', function () {
                            assert(typeof validator === 'function');
                        });
                        it('should return an invalidity string', function () {
                            return __awaiter(this, void 0, void 0, function () {
                                var reason;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, validator(options.deviceId)];
                                        case 1:
                                            reason = _a.sent();
                                            assert.equal(reason, options.expected);
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
    describe('validateOptions', function () {
        it('should not return anything for valid options', function () {
            return __awaiter(this, void 0, void 0, function () {
                var reasons;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, optionValidation_1.validateOptions({
                                someOption: 10,
                            }, {
                                someOption: optionValidation_1.validateTime,
                            })];
                        case 1:
                            reasons = _a.sent();
                            assert.equal(typeof reasons, 'undefined');
                            return [2 /*return*/];
                    }
                });
            });
        });
        describe('should return invalid reasons for invalid options', function () {
            it('should work for a real validator', function () {
                return __awaiter(this, void 0, void 0, function () {
                    var reasons;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, optionValidation_1.validateOptions({
                                    someOption: -10,
                                }, {
                                    someOption: optionValidation_1.validateTime,
                                })];
                            case 1:
                                reasons = _a.sent();
                                assert.equal(typeof reasons, 'object');
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should work for a mock async validator', function () {
                return __awaiter(this, void 0, void 0, function () {
                    var reasons;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, optionValidation_1.validateOptions({
                                    someOption: -10,
                                }, {
                                    someOption: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                        return [2 /*return*/, 'foobar'];
                                    }); }); },
                                })];
                            case 1:
                                reasons = _a.sent();
                                assert.equal(typeof reasons, 'object');
                                return [2 /*return*/];
                        }
                    });
                });
            });
            it('should work for a mock validator', function () {
                return __awaiter(this, void 0, void 0, function () {
                    var reasons;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, optionValidation_1.validateOptions({
                                    someOption: -10,
                                }, {
                                    someOption: function () { return 'foobar'; },
                                })];
                            case 1:
                                reasons = _a.sent();
                                assert.equal(typeof reasons, 'object');
                                return [2 /*return*/];
                        }
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=optionValidation.js.map