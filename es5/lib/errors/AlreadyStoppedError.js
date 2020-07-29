"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("../constants");
var InvalidStateError_1 = require("./InvalidStateError");
/**
 * @internalapi
 * Specific instance of a `InvalidStateError` that mostly occurs when a test
 * is stopped more than once.
 */
var AlreadyStoppedError = /** @class */ (function (_super) {
    __extends(AlreadyStoppedError, _super);
    function AlreadyStoppedError() {
        var _this = _super.call(this, 'This test already has a defined end timestamp. ' +
            'Tests should not be run multiple times, instead start a new one.') || this;
        _this.name = constants_1.ErrorName.AlreadyStoppedError;
        return _this;
    }
    return AlreadyStoppedError;
}(InvalidStateError_1.InvalidStateError));
exports.AlreadyStoppedError = AlreadyStoppedError;
//# sourceMappingURL=AlreadyStoppedError.js.map