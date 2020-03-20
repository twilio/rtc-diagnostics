"use strict";
// tslint:disable no-empty
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockRTCDataChannelFactory = function (options) { return /** @class */ (function () {
    function class_1() {
    }
    Object.defineProperty(class_1.prototype, "onmessage", {
        set: function (listener) {
            setTimeout(function () { return options.doMessage && listener({ data: 'Ahoy, world!' }); }, 10);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(class_1.prototype, "onopen", {
        set: function (listener) {
            setTimeout(function () { return options.doOpen && listener(); }, 5);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(class_1.prototype, "onclose", {
        set: function (listener) {
            setTimeout(function () { return options.doClose && listener(); }, 20);
        },
        enumerable: true,
        configurable: true
    });
    class_1.prototype.send = function () { };
    return class_1;
}()); };
//# sourceMappingURL=MockRTCDataChannel.js.map