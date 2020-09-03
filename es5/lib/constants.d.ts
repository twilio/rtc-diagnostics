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
 * Minimum bitrate samples required to emit warnings.
 * See [[WarningName.LowBitrate]]
 */
export declare const MIN_BITRATE_SAMPLE_COUNT = 5;
/**
 * @private
 * Minimum number of failing bitrate values before emitting a warning.
 * See [[WarningName.LowBitrate]]
 */
export declare const MIN_BITRATE_FAIL_COUNT = 3;
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
 * All of the expected error names to be thrown by the diagnostics tests.
 * These names are set in the error objects as the `.name` member.
 */
export declare enum ErrorName {
    AlreadyStoppedError = "already-stopped",
    DiagnosticError = "diagnostic",
    InvalidOptionsError = "invalid-options",
    InvalidStateError = "invalid-state",
    UnsupportedError = "unsupported"
}
/**
 * All of the expected warnings raised by the diagnostics tests.
 * A `warning-cleared` event is raised if there is an active warning
 * and if the criteria of the warning are no longer met.
 *
 * Example:
 *
 * ```ts
 * test.on(AudioInputTest.Events.Warning, (warningName: WarningName) => {
 *  console.log(`Warning detected: ${warningName}`);
 * });
 *
 * test.on(AudioInputTest.Events.WarningCleared, (warningName: WarningName) => {
 *  console.log(`Warning cleared: ${warningName}`);
 * });
 * ```
 *
 */
export declare enum WarningName {
    /**
     * Raised by the [[AudioInputTest]] when the volume events recorded are both low and constant.
     * The criteria for raising this warning are:
     * - If there are at least three seconds worth of audio samples.
     * - The standard deviation of those samples is less than 1% of the max
     *   possible volume value (255).
     * - The average of those samples is less than 1% of the max possible volume
     *   value (255).
     */
    LowAudioLevel = "low-audio-level",
    /**
     * Raised by the [[MediaConnectionBitrateTest]] when the recorded bitrates are consistently lower than a certain threshold.
     * The criteria for raising this warning are:
     *  - At least 5 seconds worth of bitrate values have been recorded.
     *  - 3 out of last 5 bitrate values are less than [[MediaConnectionBitrateTest.Options.minBitrateThreshold]].
     */
    LowBitrate = "low-bitrate"
}
