/**
 * The following rule is necessary as having `MediaConnectionBitrateTest` imported first causes
 * unit tests to crash.
 */
/* tslint:disable ordered-imports */

// Set up global mocks first.
import './mock.ts';

// Utils
import './utils/candidate';
import './utils/optionValidation';

// Recorder
import './recorder/audio';
import './recorder/encoder';

// Diagnostics tests
import './AudioInputTest';
import './AudioOutputTest';
import './MediaConnectionBitrateTest';
import './VideoInputTest';
