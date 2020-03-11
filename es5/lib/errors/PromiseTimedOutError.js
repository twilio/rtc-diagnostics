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
/**
 * @internalapi
 * Error that is thrown by the utility `waitForPromise`.
 */
var PromiseTimedOutError = /** @class */ (function (_super) {
    __extends(PromiseTimedOutError, _super);
    function PromiseTimedOutError() {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, PromiseTimedOutError.prototype);
        return _this;
    }
    return PromiseTimedOutError;
}(Error));
exports.PromiseTimedOutError = PromiseTimedOutError;
//# sourceMappingURL=PromiseTimedOutError.js.map