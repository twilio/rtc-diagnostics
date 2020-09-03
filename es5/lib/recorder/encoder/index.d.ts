/**
 * The [[Encoder]] reads audio data via an AudioContext and encodes it to a wav data format.
 * The wav data can be then converted into a blob which can be used for playback.
 * @internalapi
 */
export declare class Encoder {
    /**
     * The AudioContext instance to use for processing audio data
     */
    private _audioContext;
    /**
     * A Web Worker instance which handles encoding of raw data into wav
     */
    private _encoder;
    /**
     * The input MediaStream to record
     */
    private _stream;
    /**
     * Construct an [[Encoder]] instance and and prepares the Web Worker
     * @constructor
     * @param stream - The input MediaStream to record
     * @param audioContext - The AudioContext instance to use for processing audio data
     */
    constructor(stream: MediaStream, audioContext: AudioContext, audioEncoder?: any);
    /**
     * Called when raw data is available
     * @override
     */
    ondataavailable: Function;
    /**
     * Called when encoding stops
     * @override
     */
    onstop: Function;
    /**
     * Starts the encoding process
     */
    start(): void;
    /**
     * Stops the encoding process
     */
    stop(): void;
}
