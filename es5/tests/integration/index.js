"use strict";
// tslint:disable only-arrow-functions
Object.defineProperty(exports, "__esModule", { value: true });
var sinon = require("sinon");
/**
 * Import all tests.
 */
require("./InputTest");
require("./OutputTest");
/**
 * Recommended by Sinon.JS to prevent memory leaks.
 */
afterEach(function () {
    sinon.restore();
});
//# sourceMappingURL=index.js.map