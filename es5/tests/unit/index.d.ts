/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
import './mock.ts';
import './InputTest';
import './OutputTest';
import './utils';
import './utils/optionValidation';
import './BitrateTest';
