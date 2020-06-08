/**
 * @private
 * Max number of packets to send to data channel for bitrate test
 */
export declare const MAX_NUMBER_PACKETS = 100;
/**
 * @private
 * Minimum bitrate required to pass bitrate test
 * See https://www.twilio.com/docs/voice/client/javascript/voice-client-js-and-mobile-sdks-network-connectivity-requirements#network-bandwidth-requirements
 */
export declare const MIN_BITRATE_THRESHOLD = 100;
/**
 * @private
 * Data channel buffered amount
 */
export declare const BYTES_KEEP_BUFFERED: number;
/**
 * @private
 * Test packet used for bitrate test
 */
export declare const TEST_PACKET: string;
/**
 * @private
 * We are unable to use the `.ogg` file here in Safari.
 */
export declare const INCOMING_SOUND_URL: string;
/**
 * @private
 * Test names.
 */
export declare enum TestNames {
    InputAudioDevice = "input-volume",
    OutputAudioDevice = "output-volume"
}
