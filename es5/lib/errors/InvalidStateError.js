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
var DiagnosticError_1 = require("./DiagnosticError");
/**
 * @internalapi
 * Represents when a test in the Diagnostics SDK is an unknown or unexpected
 * state, usually resulting in fatal error.
 */
var InvalidStateError = /** @class */ (function (_super) {
    __extends(InvalidStateError, _super);
    /**
     * Sets the name to `InvalidStateError`.
     * @param message
     */
    function InvalidStateError(message) {
        var _this = _super.call(this, undefined, message) || this;
        _this.name = 'InvalidStateError';
        return _this;
    }
    return InvalidStateError;
}(DiagnosticError_1.DiagnosticError));
exports.InvalidStateError = InvalidStateError;
//# sourceMappingURL=InvalidStateError.js.map