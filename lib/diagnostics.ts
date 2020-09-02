import { AudioInputTest, testAudioInputDevice } from './AudioInputTest';
import { AudioOutputTest, testAudioOutputDevice } from './AudioOutputTest';
import { ErrorName, WarningName } from './constants';
import { DiagnosticError } from './errors/DiagnosticError';
import { MediaConnectionBitrateTest, testMediaConnectionBitrate } from './MediaConnectionBitrateTest';
import { VideoResolution } from './types';
import { testVideoInputDevice, VideoInputTest } from './VideoInputTest';

/**
 * @internalapi
 * Tell Typescript that we would like to modify the `Twilio` object on the
 * `window` global.
 */
declare global {
  interface Window {
    Twilio: Object & { Diagnostics?: any };
  }
}

/**
 * If the `Twilio` object does not exist, make it.
 * Then, add the `Diagnostics` object to it.
 * This makes `window.Twilio.Diagnostics` available after loading the bundle in
 * the browser.
 */
window.Twilio = window.Twilio || {};
window.Twilio.Diagnostics = {
  ...window.Twilio.Diagnostics,
  testAudioInputDevice,
  testAudioOutputDevice,
  testMediaConnectionBitrate,
  testVideoInputDevice,
};

/**
 * Expose the tests if installed as a npm module for both TS and JS
 */
export {
  AudioInputTest,
  AudioOutputTest,
  DiagnosticError,
  MediaConnectionBitrateTest,
  ErrorName,
  testAudioInputDevice,
  testAudioOutputDevice,
  testMediaConnectionBitrate,
  testVideoInputDevice,
  VideoInputTest,
  VideoResolution,
  WarningName,
};
