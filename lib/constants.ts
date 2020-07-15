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
 * The number of milliseconds to wait to receive data in bitrate test before timing out.
 */
export const BITRATE_TEST_TIMEOUT_MS: number = 15000;

/**
 * @private
 * Test names.
 */
export enum TestNames {
  InputAudioDevice = 'input-volume',
  OutputAudioDevice = 'output-volume',
}
