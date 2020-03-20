/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
import './InputTest';
import './NetworkTest';
import './OutputTest';
import './utils';
import './utils/optionValidation';
import './BitrateTest';
