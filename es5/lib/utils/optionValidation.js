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
var polyfills_1 = require("../polyfills");
/**
 * @internalapi
 * Return a function that validates an audio device by ID. It will returns a
 * `string` representing why the ID is invalid, or nothing if it is valid. Will
 * throw if `enumerateDevices` is not supported by the system.
 * @param options Options to pass to the validator. A mock `enumerateDevices`
 * may be passed here, as well as a `kind` may be passed here if there is a
 * desire to check the `kind` of audio device.
 * @returns A function that takes a `string` representing the audio device ID to
 * be validated and returns a Promise resolving a `string` representing the
 * invalid message or `undefined` if the audio device is valid.
 */
function createAudioDeviceValidator(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var opts = __assign({ enumerateDevices: polyfills_1.enumerateDevices }, options);
    /**
     * The audio device validator that will be returned.
     * @param deviceId The device ID to be validated.
     * @returns A Promise that resolves with a `string` representing why the
     * device ID is invalid, or `undefined` if it is valid.
     */
    return function (deviceId) { return __awaiter(_this, void 0, void 0, function () {
        var devices, _a, matchingDevicesKind, matchingDevicesId, matchingDevicesIdAndKind;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = opts.enumerateDevices;
                    if (!_a) return [3 /*break*/, 2];
                    return [4 /*yield*/, opts.enumerateDevices()];
                case 1:
                    _a = (_b.sent());
                    _b.label = 2;
                case 2:
                    devices = _a;
                    if (!devices) {
                        throw polyfills_1.EnumerateDevicesUnsupportedError;
                    }
                    if (!devices.length) {
                        return [2 /*return*/, 'No audio devices available.'];
                    }
                    // `deviceId` as `undefined` is a valid value as this will cause
                    // `getUserMedia` to just get the default device
                    if (deviceId === undefined) {
                        if (opts.kind) {
                            matchingDevicesKind = devices.filter(function (device) {
                                return device.kind === opts.kind;
                            });
                            if (!matchingDevicesKind.length) {
                                return [2 /*return*/, "No devices found with the correct kind \"" + opts.kind + "\"."];
                            }
                        }
                        return [2 /*return*/];
                    }
                    matchingDevicesId = devices.filter(function (device) {
                        return device.deviceId === deviceId;
                    });
                    if (!matchingDevicesId.length) {
                        return [2 /*return*/, "Device ID \"" + deviceId + "\" not found within list of available devices."];
                    }
                    if (opts.kind) {
                        matchingDevicesIdAndKind = matchingDevicesId.filter(function (device) { return device.kind === opts.kind; });
                        if (!matchingDevicesIdAndKind.length) {
                            return [2 /*return*/, "Device ID \"" + deviceId + "\" is not the correct \"kind\","
                                    + (" expected \"" + opts.kind + "\".")];
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
}
exports.createAudioDeviceValidator = createAudioDeviceValidator;
/**
 * @internalapi
 * Validate that an option is a valid device ID to pass to `getUserMedia` or
 * `setSinkId`.
 * @param option The option to check is a valid device ID to pass to
 * `getUserMedia` or `setSinkId`.
 * @returns If the option is not valid, return a string that describes why,
 * otherwise `undefined`.
 */
function validateDeviceId(option) {
    if (!(['string', 'undefined'].includes(typeof option) || option === null)) {
        return 'If "deviceId" is defined, it must be a "string".';
    }
}
exports.validateDeviceId = validateDeviceId;
/**
 * @internalapi
 * Validate that an option is a valid string.
 * @param option The option to check is a valid string.
 * @returns If the option is not valid, return a string that describes why it is
 * invalid, otherwise return `undefined`.
 */
function validateString(option) {
    var type = typeof option;
    if (type !== 'string') {
        return "Option cannot have type \"" + type + "\", must be \"string\".";
    }
}
exports.validateString = validateString;
/**
 * @internalapi
 * Validate a time-based parameter, i.e. duration or interval.
 * @param option The duration of time to validate
 * @returns A possibly undefined string, if the time is valid it will return
 * undefined, otherwise an error message
 */
function validateTime(option) {
    var doesNotExistMessage = validateExists(option);
    if (doesNotExistMessage) {
        return doesNotExistMessage;
    }
    if (typeof option !== 'number') {
        return 'Time must be a number.';
    }
    if (option < 0) {
        return 'Time must always be non-negative.';
    }
}
exports.validateTime = validateTime;
/**
 * @internalapi
 * Validate that an option is neither `undefined` nor `null`.
 * @param option The option to check exists.
 * @returns A possibly undefined string, if the option exists it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
function validateExists(option) {
    if (option === undefined || option === null) {
        return "Option cannot be \"" + String(option) + "\".";
    }
}
exports.validateExists = validateExists;
/**
 * @internalapi
 * Validate that an option is a `boolean`.
 * @param option The option to check.
 * @returns A possibly undefined string, if the option is valid it will return
 * `undefined`, otherwise a string representing why the option is invalid
 */
function validateBoolean(option) {
    if (typeof option !== 'boolean') {
        return "Option must be \"boolean\".";
    }
}
exports.validateBoolean = validateBoolean;
/**
 * @internalapi
 * Validate input options to the [[InputTest]].
 * @param inputOptions The options to validate.
 * @param config A record of option names to either a single
 * [[ValidatorFunction]] or an array of [[ValidatorFunctions]].
 * @returns A Promise that resolves either with a [[InvalidityRecord]] describing
 * which options are invalid and why, or `undefined` if all options are vaild.
 */
function validateOptions(inputOptions, config) {
    return __awaiter(this, void 0, void 0, function () {
        var validity;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    validity = {};
                    return [4 /*yield*/, Promise.all(Object.entries(config).map(function (_a) {
                            var optionKey = _a[0], validatorFunctions = _a[1];
                            return __awaiter(_this, void 0, void 0, function () {
                                var optionValue, validators;
                                var _this = this;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            if (!validatorFunctions) {
                                                return [2 /*return*/];
                                            }
                                            optionValue = inputOptions[optionKey];
                                            validators = Array.isArray(validatorFunctions)
                                                ? validatorFunctions
                                                : [validatorFunctions];
                                            return [4 /*yield*/, Promise.all(validators.map(function (validator) { return __awaiter(_this, void 0, void 0, function () {
                                                    var invalidReason, invalidReasons;
                                                    return __generator(this, function (_a) {
                                                        switch (_a.label) {
                                                            case 0: return [4 /*yield*/, validator(optionValue)];
                                                            case 1:
                                                                invalidReason = _a.sent();
                                                                if (invalidReason) {
                                                                    invalidReasons = validity[optionKey];
                                                                    if (invalidReasons) {
                                                                        invalidReasons.push(invalidReason);
                                                                    }
                                                                    else {
                                                                        validity[optionKey] = [invalidReason];
                                                                    }
                                                                }
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); }))];
                                        case 1:
                                            _b.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        }))];
                case 1:
                    _a.sent();
                    if (Object.keys(validity).length) {
                        return [2 /*return*/, validity];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.validateOptions = validateOptions;
//# sourceMappingURL=optionValidation.js.map