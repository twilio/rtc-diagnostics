"use strict";
/**
 * The following rule is necessary as having `MediaConnectionBitrateTest` imported first causes
 * unit tests to crash.
 */
/* tslint:disable ordered-imports */
Object.defineProperty(exports, "__esModule", { value: true });
// Set up global mocks first.
require("./mock.ts");
// Utils
require("./utils/candidate");
require("./utils/optionValidation");
// Recorder
require("./recorder/audio");
require("./recorder/encoder");
// Diagnostics tests
require("./AudioInputTest");
require("./AudioOutputTest");
require("./MediaConnectionBitrateTest");
require("./VideoInputTest");
//# sourceMappingURL=index.js.map