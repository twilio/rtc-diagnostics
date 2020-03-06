import * as pack from '../package.json';

/**
 * @internalapi
 * We are unable to use the `.ogg` file here in Safari.
 */
export const INCOMING_SOUND_URL: string =
  `https://sdk.twilio.com/js/client/sounds/releases/1.0.0/incoming.mp3?cache=${pack.name}+${pack.version}`;

/**
 * @internalapi
 * Test names.
 */
export enum TestNames {
  InputAudioDevice = 'input-volume',
  OutputAudioDevice = 'output-volume',
}
