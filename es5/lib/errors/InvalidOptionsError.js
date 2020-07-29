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
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 * Error that is thrown when there are invalid options passed to a test.
 */
var InvalidOptionsError = /** @class */ (function (_super) {
    __extends(InvalidOptionsError, _super);
    function InvalidOptionsError(reasons) {
        var _this = _super.call(this, undefined, 'Some of the options passed to this test were unable to be validated.') || this;
        _this.reasons = {};
        _this.reasons = reasons;
        _this.name = constants_1.ErrorName.InvalidOptionsError;
        return _this;
    }
    return InvalidOptionsError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidOptionsError = InvalidOptionsError;
//# sourceMappingURL=InvalidOptionsError.js.map