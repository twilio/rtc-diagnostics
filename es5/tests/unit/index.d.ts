/**
 * The following rule is necessary as having `BitrateTest` imported first causes
 * unit tests to crash.
 */
import './mock.ts';
import './utils/candidate';
import './utils/optionValidation';
import './utils/waitForPromise';
import './recorder/audio';
import './recorder/encoder';
import './InputTest';
import './OutputTest';
import './BitrateTest';
