/// <reference types="node" />
import { EventEmitter } from 'events';
import { DiagnosticError } from './errors';
import { SubsetRequired, TimeMeasurement, VideoResolution } from './types';
export declare interface VideoInputTest {
    /**
     * This event is emitted with a test report when the test ends.
     * @param event [[VideoInputTest.Events.End]]
     * @param report Summary of the test.
     * @private
     */
    emit(event: VideoInputTest.Events.End, report: VideoInputTest.Report): boolean;
    /**
     * This event is emitted with a [[DiagnosticError]] when the test encounters
     * an error, fatal or not.
     * @param event [[VideoInputTest.Events.Error]]
     * @param error The [[DiagnosticError]] that was encountered.
     * @private
     */
    emit(event: VideoInputTest.Events.Error, error: DiagnosticError): boolean;
    /**
     * Raised upon completion of the test.
     * @param event [[VideoInputTest.Events.End]]
     * @param listener A callback that expects the following parameters:
     *  An [[VideoInputTest.Report]] that summarizes the test.
     * @returns This [[VideoInputTest]] instance.
     * @event
     */
    on(event: VideoInputTest.Events.End, listener: (report: VideoInputTest.Report) => any): this;
    /**
     * Raised by the test when encountering an error with a parameter of type
     * [[DiagnosticError]].
     * @param event [[VideoInputTest.Events.Error]]
     * @param listener A callback that expects the following parameters:
     *  A [[DiagnosticError]] that the test encountered.
     * @returns This [[VideoInputTest]] instance.
     * @event
     */
    on(event: VideoInputTest.Events.Error, listener: (error: DiagnosticError) => any): this;
}
/**
 * [[VideoInputTest]] class that parses options and starts a video input device
 * test.
 *
 * Please see [[testVideoInputDevice]] for details and recommended practices.
 */
export declare class VideoInputTest extends EventEmitter {
    /**
     * The name of the test.
     */
    static readonly testName: string;
    /**
     * Default options for the test.
     */
    private static defaultOptions;
    /**
     * Timestamp of when the test was ended.
     */
    private _endTime;
    /**
     * An array of any errors that occur during the run time of the test.
     */
    private readonly _errors;
    /**
     * Options to be used throughout the runtime of the test.
     */
    private _options;
    /**
     * The promise returned by the `HTMLMediaElement` after playing the stream
     * captured by `getUserMedia`.
     */
    private _playPromise;
    /**
     * Timestamp of when the test was started.
     */
    private _startTime;
    /**
     * Timer ID of the test duration timeout.
     */
    private _timeoutId;
    /**
     * The `MediaStream` resulting from calling `getUserMedia`.
     */
    private _userMediaStream;
    /**
     * Constructor for a [[VideoInputTest]] object.
     * @param options Options to be used during the runtime of the test.
     */
    constructor(options?: VideoInputTest.Options);
    /**
     * Stops the test. Emits a report upon the end of the test.
     */
    stop(): void;
    /**
     * Clean up the test.
     */
    private _cleanup;
    /**
     * Helper function that should be called when an error occurs, recoverable
     * or not.
     * @param error
     */
    private _onError;
    /**
     * Warning event handler.
     * @param warning
     */
    private _onWarning;
    /**
     * Entry point of the test.
     */
    private _startTest;
}
export declare namespace VideoInputTest {
    /**
     * Possible events that a [[VideoInputTest]] might emit. See [[VideoInputTest.on]].
     */
    enum Events {
        End = "end",
        Error = "error"
    }
    interface Report {
        /**
         * The device ID used to get a MediaStream from using getUserMedia.
         */
        deviceId: string | undefined;
        /**
         * Any errors that occurred during the test.
         */
        errors: DiagnosticError[];
        /**
         * Resolution of the captured video frames in pixels.
         */
        resolution: VideoResolution;
        /**
         * The name of the test.
         */
        testName: string;
        /**
         * Time measurements of test run time.
         */
        testTiming?: TimeMeasurement;
    }
    interface Options {
        /**
         * Whether or not to log debug statements to the console.
         * @private
         */
        debug?: boolean;
        /**
         * The device ID to try to get a MediaStream from using `getUserMedia`.
         */
        deviceId?: string;
        /**
         * Duration of time to run the test in milliseconds. If not specified, then
         * the [[VideoInputTest]] will keep running until [[VideoInputTest.stop]] is
         * called.
         *
         * @default Infinity
         */
        duration?: number;
        /**
         * The video element used to render the device feed. If not provided, then
         * the video feed is not rendered.
         */
        element?: HTMLVideoElement;
        /**
         * Used to mock calls to `getUserMedia`.
         * @private
         */
        getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
        /**
         * The device's capture resolution in pixels. If not specified, then the
         * default capture resolution is used.
         */
        resolution?: VideoResolution;
    }
    /**
     * Option typing after initialization, so we can have type guarantees.
     * @private
     */
    type InternalOptions = SubsetRequired<Options, 'debug' | 'duration'>;
}
/**
 * This test examines video input capabilities. It serves to help diagnose
 * potential video device issues that would prevent video from being shared in
 * a WebRTC call.
 *
 * ---
 *
 * This test will use `getUserMedia` to try and capture a video stream from the
 * user. If this succeeds and an `HTMLMediaElement` is passed to the test within
 * the test options, then the stream will be bound to the element and should be
 * displayed.
 *
 * ---
 *
 * When the test ends, all of the tracks within the captured `MediaStream` are
 * ended and the `srcObject` of the `HTMLMediaElement` is set to `null`.
 */
export declare function testVideoInputDevice(options?: VideoInputTest.Options): VideoInputTest;
