/**
 * The following rule is necessary as having `MediaConnectionBitrateTest` imported first causes
 * unit tests to crash.
 */
import './mock.ts';
import './utils/candidate';
import './utils/optionValidation';
import './recorder/audio';
import './recorder/encoder';
import './AudioInputTest';
import './AudioOutputTest';
import './MediaConnectionBitrateTest';
import './VideoInputTest';
