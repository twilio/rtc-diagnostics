import * as pack from '../package.json';

/**
 * @private
 * Max number of packets to send to data channel for bitrate test
 */
export const MAX_NUMBER_PACKETS = 100;

/**
 * @private
 * Minimum bitrate required to pass bitrate test
 * See https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements#network-bandwidth-requirements
 */
export const MIN_BITRATE_THRESHOLD = 100;

/**
 * @private
 * Data channel buffered amount
 */
export const BYTES_KEEP_BUFFERED = 1024 * MAX_NUMBER_PACKETS;

/**
 * @private
 * Test packet used for bitrate test
 */
export const TEST_PACKET = Array(1024).fill('h').join('');

/**
 * @private
 * We are unable to use the `.ogg` file here in Safari.
 */
export const INCOMING_SOUND_URL: string =
  `https://sdk.twilio.com/js/client/sounds/releases/1.0.0/incoming.mp3?cache=${pack.name}+${pack.version}`;

/**
 * @private
 * Test names.
 */
export enum TestName {
  InputAudioDevice = 'input-volume',
  OutputAudioDevice = 'output-volume',
}

/**
 * All of the expected error names to be thrown by the diagnostics tests.
 * These names are set in the error objects as the `.name` member.
 */
export enum ErrorName {
  AlreadyStoppedError = 'already-stopped',
  DiagnosticError = 'diagnostic',
  InvalidOptionError = 'invalid-option',
  InvalidOptionsError = 'invalid-options',
  InvalidStateError = 'invalid-state',
  PromiseTimedOutError = 'promise-timed-out',
  UnsupportedError = 'unsupported',
}

/**
 * All of the expected warnings to be thrown by the diagnostics tests.
 */
export enum WarningName {
  /**
   * The `low-audio-level` warning is raised when the volume events recorded
   * by the input audio device test [[InputTest]] are both low and constant.
   *
   * The warning criteria is when the following are all true:
   * - If there are at least three seconds worth of audio samples.
   * - The standard deviation of those samples is less than 1% of the max
   *   possible volume value (255).
   * - The average of those samples is less than 1% of the max possible volume
   *   value (255).
   *
   * When any of the previous criteria are no longer met, the `warning-cleared`
   * event for `low-audio-level` is raised if `low-audio-level` has been raised.
   * Only one `low-audio-level` warning will be raised until the
   * `warning-cleared` event has been raised.
   */
  LowAudioLevel = 'low-audio-level',
}
