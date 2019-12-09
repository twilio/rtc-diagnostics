import { testInputDevice } from './InputTest';
import { testOutputDevice } from './OutputTest';

/**
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
  testInputDevice,
  testOutputDevice,
};
