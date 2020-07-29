"use strict";
// tslint:disable max-classes-per-file
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
/**
 * Mock browser only errors.
 */
global.DOMError = /** @class */ (function (_super) {
    __extends(DOMErrorMock, _super);
    function DOMErrorMock() {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, DOMErrorMock.prototype);
        return _this;
    }
    return DOMErrorMock;
}(Error));
global.DOMException = /** @class */ (function (_super) {
    __extends(DOMExceptionMock, _super);
    function DOMExceptionMock() {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, DOMExceptionMock.prototype);
        return _this;
    }
    return DOMExceptionMock;
}(Error));
//# sourceMappingURL=mock.js.map