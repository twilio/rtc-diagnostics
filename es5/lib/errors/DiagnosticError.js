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
/**
 * @internalapi
 * Generic Diagnostic SDK error that provides a superclass for all other errors.
 */
var DiagnosticError = /** @class */ (function (_super) {
    __extends(DiagnosticError, _super);
    /**
     * Immediately sets the timestamp and sets the name to `DiagnosticError`.
     * @param domError
     * @param message
     */
    function DiagnosticError(domError, message) {
        var _this = _super.call(this, message) || this;
        _this.timestamp = Date.now();
        _this.domError = domError;
        Object.setPrototypeOf(_this, DiagnosticError.prototype);
        _this.name = constants_1.ErrorName.DiagnosticError;
        return _this;
    }
    return DiagnosticError;
}(Error));
exports.DiagnosticError = DiagnosticError;
//# sourceMappingURL=DiagnosticError.js.map