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
 * Error that can be thrown when a single option passed to a test is invalid.
 */
var InvalidOptionError = /** @class */ (function (_super) {
    __extends(InvalidOptionError, _super);
    function InvalidOptionError(option, reason, error) {
        var _this = this;
        var domError = (typeof DOMError !== 'undefined' && error instanceof DOMError) ||
            (typeof DOMException !== 'undefined' && error instanceof DOMException)
            ? error
            : undefined;
        _this = _super.call(this, domError, "Option \"" + option + "\" invalid with reason: \"" + reason + "\".") || this;
        _this.option = option;
        _this.reason = reason;
        _this.error = error;
        _this.name = constants_1.ErrorName.InvalidOptionError;
        return _this;
    }
    return InvalidOptionError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidOptionError = InvalidOptionError;
//# sourceMappingURL=InvalidOptionError.js.map