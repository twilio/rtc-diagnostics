"use strict";
/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
/* tslint:disable ordered-imports */
Object.defineProperty(exports, "__esModule", { value: true });
// Set up global mocks first.
require("./mock.ts");
// Utils
require("./utils/candidate");
require("./utils/optionValidation");
require("./utils/waitForPromise");
// Recorder
require("./recorder/audio");
require("./recorder/encoder");
// Diagnostics tests
require("./InputTest");
require("./OutputTest");
require("./BitrateTest");
//# sourceMappingURL=index.js.map