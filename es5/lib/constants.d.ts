/**
 * @private
 * Parameters passed to our audio encoder
 * buffer size, input channels, output channes
 */
export declare const ENCODER_PARAMS: number[];
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
 * The number of milliseconds to wait to receive data in bitrate test before timing out.
 */
export declare const BITRATE_TEST_TIMEOUT_MS: number;
/**
 * @private
 * Test names.
 */
export declare enum TestName {
    InputAudioDevice = "input-volume",
    OutputAudioDevice = "output-volume"
}
/**
 * All of the expected error names to be thrown by the diagnostics tests.
 * These names are set in the error objects as the `.name` member.
 */
export declare enum ErrorName {
    AlreadyStoppedError = "already-stopped",
    DiagnosticError = "diagnostic",
    InvalidOptionError = "invalid-option",
    InvalidOptionsError = "invalid-options",
    InvalidStateError = "invalid-state",
    PromiseTimedOutError = "promise-timed-out",
    UnsupportedError = "unsupported"
}
/**
 * All of the expected warnings to be thrown by the diagnostics tests.
 */
export declare enum WarningName {
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
    LowAudioLevel = "low-audio-level"
}
