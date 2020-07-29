import { DiagnosticError } from '../errors';
/**
 * The [[AudioRecorder]] allows cross browser recording of audio from an input MediaStream.
 * It uses the native MediaStream Recording APIs if available, else, it process raw audio data
 * and converts it to a blob.
 * @internalapi
 */
export declare class AudioRecorder {
    /**
     * The raw audio data captured during the test
     */
    private _audioData;
    /**
     * The MediaRecorder instance to be used for capturing audio
     */
    private _mediaRecorder;
    /**
     * Promise handle after calling .stop()
     */
    private _stopPromise;
    /**
     * The source input stream
     */
    private _stream;
    /**
     * The resuling object url that can be used for audio playback
     */
    private _url;
    /**
     * Construct an [[AudioRecorder]] instance and will start the recording immediately.
     * @constructor
     * @param options
     */
    constructor(options: AudioRecorder.ExtendedOptions);
    /**
     * Stops the recording process.
     * If successful, the `.url` property will be populated.
     */
    stop(): Promise<DiagnosticError | null>;
    /**
     * Generates the object url that can be used for audio playback from raw audio data
     */
    private _generateObjectUrl;
    /**
     * The resuling object url that can be used for audio playback
     */
    get url(): string;
}
/**
 * @internalapi
 */
export declare namespace AudioRecorder {
    /**
     * Options that may be passed to [[AudioRecorder]] constructor for internal testing.
     * @internalapi
     */
    interface ExtendedOptions extends Options {
        /**
         * The MediaRecorder class to use for testing
         */
        MediaRecorderFactory?: any;
    }
    /**
     * Options passed to [[AudioRecorder]] constructor.
     * @internalapi
     */
    interface Options {
        /**
         * The AudioContext instance to use
         */
        audioContext: AudioContext;
        /**
         * The source input stream
         */
        stream: MediaStream;
    }
}
