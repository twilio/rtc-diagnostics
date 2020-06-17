"use strict";
/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
/* tslint:disable ordered-imports */
Object.defineProperty(exports, "__esModule", { value: true });
// Set up global mocks.
require("./mock.ts");
require("./InputTest");
require("./OutputTest");
require("./utils");
require("./utils/optionValidation");
require("./BitrateTest");
//# sourceMappingURL=index.js.map