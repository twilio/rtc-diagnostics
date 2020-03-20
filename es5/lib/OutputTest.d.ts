/// <reference types="node" />
import { EventEmitter } from 'events';
import { TestNames } from './constants';
import { DiagnosticError } from './errors';
import { AudioElement, SubsetRequired, TimeMeasurement } from './types';
export declare interface OutputTest {
    /**
     * This event is emitted when the test ends.
     * @param event [[OutputTest.Events.End]]
     * @param report A summary of the test.
     * @private
     */
    emit(event: OutputTest.Events.End, report: OutputTest.Report): boolean;
    /**
     * This event is emitted when the test encounters an error, fatal or not.
     * @param event [[OutputTest.Events.Error]]
     * @param error An error that was encountered during the run time of the test.
     * @private
     */
    emit(event: OutputTest.Events.Error, error: DiagnosticError): boolean;
    /**
     * This event is emitted by the test after succesfully starting, and emits
     * the volume of the audio source every [[OutputTest.Options.pollIntervalMs]]
     * milliseconds.
     * @param event [[OutputTest.Events.Volume]]
     * @param value The volume of the audio source.
     * @private
     */
    emit(event: OutputTest.Events.Volume, value: number): boolean;
    /**
     * Raised when the test ends. The stop condition depends on if the option
     * to loop was set to `true` or `false`. If `false`, then the test ends either
     * when the audio file is finished playing, or when a time has elapsed
     * greater than [[OutputTest.Options.duration]].
     * @event
     * @param event [[OutputTest.Events.End]]
     * @param listener A listener function that expects the following parameters
     * when the event is raised:
     * - A [[OutputTest.Report]] that summarizes the run time of the test.
     * @returns This [[OutputTest]] instance.
     */
    on(event: OutputTest.Events.End, listener: (report: OutputTest.Report) => any): this;
    /**
     * Raised when the test has run into an error, fatal or not.
     * @event
     * @param event [[OutputTest.Events.Error]]
     * @param listener A listener function that expects the following parameters
     * when the event is raised:
     * - The [[DiagnosticError]].
     * @returns This [[OutputTest]] instance.
     */
    on(event: OutputTest.Events.Error, listener: (error: DiagnosticError) => any): this;
    /**
     * Raised every [[OutputTest.Options.pollIntervalMs]] after the test
     * starts successfully. Will have a `number` parameter representing the
     * current volume of the audio file.
     * @event
     * @param event [[OutputTest.Events.Volume]]
     * @param listener A listener function that expects the following parameters
     * when the event is raised:
     * - A number representing the volume of the audio source.
     * @returns This [[OutputTest]] instance.
     */
    on(event: OutputTest.Events.Volume, listener: (value: number) => any): this;
}
/**
 * Supervises an output device test by playing a sound clip that is either the
 * ringing tone for the Client SDK, or defined by the member `testURI` in the
 * `options` parameter.
 *
 * If the data at `testURI` is unable to be loaded, meaning the error event is
 * raised on the audio element, then the test ends immediately with an error in
 * the report.
 *
 * If `doLoop` is set to `false`, then the test will run for either the option
 * `duration`, or the full duration of the audio file, which ever is shorter.
 * If `doLoop` is set to `true`, it will only run as long as the `duration`
 * option.
 * If the test times out (as defined by the `duration` in the `options`
 * paramater), then the test is considered passing or not by the `passOnTimeout`
 * option and ends.
 *
 * If the more than 50% of the volume levels are silent, then the test is considered failing.
 */
export declare class OutputTest extends EventEmitter {
    /**
     * The name of the test.
     */
    static testName: TestNames.OutputAudioDevice;
    /**
     * Default options for the [[OutputTest]]. Overwritten by any option passed
     * during the construction of the test.
     */
    private static defaultOptions;
    /**
     * An `AudioContext` that is used to process the audio source.
     */
    private _audioContext;
    /**
     * An `AudioElement` that is attached to the DOM to play audio.
     */
    private _audioElement;
    /**
     * The default media devices when starting the test.
     */
    private _defaultDevices;
    /**
     * A timestamp of when the test ends.
     */
    private _endTime;
    /**
     * An array of errors encountered by the test during its run time.
     */
    private readonly _errors;
    /**
     * Options passed to and set in the constructor to be used during the run
     * time of the test.
     */
    private _options;
    /**
     * A Promise that resolves when the `AudioElement` successfully starts playing
     * audio. Will reject if not possible.
     */
    private _playPromise;
    /**
     * A timestamp of when the test starts. This is set in the constructor and not
     * when the test succesfully starts.
     */
    private _startTime;
    /**
     * Volume values generated by the test over its run time.
     */
    private readonly _values;
    /**
     * Timeout created by `setTimeout`, used to loop the volume logic.
     */
    private _volumeTimeout;
    /**
     * Sets up several things for the `OutputTest` to run later in the
     * `_startTest` function.
     * An `AudioContext` is created if none is passed in the `options` parameter
     * and the `_startTime` is immediately set.
     * @param options
     */
    constructor(options?: OutputTest.Options);
    /**
     * Stops the test.
     * @param pass whether or not the test should pass. If set to false, will
     * override the result from determining whether audio is silent from the collected volume values.
     */
    stop(pass?: boolean): OutputTest.Report | undefined;
    /**
     * Cleanup the test.
     */
    private _cleanup;
    /**
     * Error event handler. Adds the error to the internal list of errors that is
     * forwarded in the report.
     * @param error
     */
    private _onError;
    /**
     * Volume event handler, adds the value to the list `_values` and emits it
     * under the event `volume`.
     * @param volume
     */
    private _onVolume;
    /**
     * Warning event handler.
     * @param warning
     */
    private _onWarning;
    /**
     * Entry point of the test, called after setup in the constructor.
     * Emits the volume levels of the audio.
     * @event `OutputTest.Events.Volume`
     */
    private _startTest;
}
export declare namespace OutputTest {
    /**
     * Events that the OutputTest will emit as it runs.
     * Please see [[OutputTest.on]] for how to listen to these
     * events.
     */
    enum Events {
        End = "end",
        Error = "error",
        Volume = "volume"
    }
    /**
     * Options passed to [[OutputTest]] constructor.
     */
    interface Options {
        /**
         * An `AudioContext` to be used by the test.
         * @private
         */
        audioContextFactory?: typeof window.AudioContext;
        /**
         * A constuctor that is used to create an [[AudioElement]], useful for
         * mocks.
         * @private
         */
        audioElementFactory?: new (...args: any[]) => AudioElement;
        /**
         * Whether or not to log debug statements to the console.
         * @private
         */
        debug?: boolean;
        /**
         * The `deviceId` of the audio device to attempt to play audio out of.
         * This option is directly passed to [HTMLMediaElement.setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
         */
        deviceId?: string;
        /**
         * Whether or not to loop the audio.
         * See [[OutputTest]] for details on the behavior of "timing out".
         * @default true
         */
        doLoop?: boolean;
        /**
         * Duration in milliseconds to run the test for. If this amount of time elapses, the test
         * is considered "timed out".
         * See [[OutputTest]] for details on the behavior of "timing out".
         * @default Infinity
         */
        duration?: number;
        /**
         * Used to mock the call to `enumerateDevices`.
         * @private
         */
        enumerateDevices?: typeof navigator.mediaDevices.enumerateDevices;
        /**
         * Set [[OutputTest.Report.didPass]] to true or not upon test timeout.
         * See [[OutputTest]] for details on the behavior of "timing out".
         * @default true
         */
        passOnTimeout?: boolean;
        /**
         * The polling rate to emit volume events in milliseconds.
         * @default 100
         */
        pollIntervalMs?: number;
        /**
         * The URI of the audio file to use for the test.
         */
        testURI?: string;
    }
    /**
     * Represents the report generated from an [[OutputTest]].
     */
    interface Report {
        /**
         * The `deviceId` of the audio device used to play audio out of.
         */
        deviceId: string | undefined;
        /**
         * Whether or not the test passed. See [[OutputTest]] for determining pass or fail.
         */
        didPass: boolean;
        /**
         * Any errors that occurred during the run-time of the [[OutputTest]].
         */
        errors: DiagnosticError[];
        /**
         * Name of the test, set to [[OutputTest.testName]].
         */
        testName: typeof OutputTest.testName;
        /**
         * Time measurements of test run time.
         */
        testTiming: TimeMeasurement;
        /**
         * The URI of the audio file used during the test.
         */
        testURI?: string;
        /**
         * The volume values emitted by the test during its run-time.
         */
        values: number[];
    }
    /**
     * Option typing after initialization, so we can have type guarantees.
     * @private
     */
    type InternalOptions = SubsetRequired<Options, 'doLoop' | 'duration' | 'passOnTimeout' | 'pollIntervalMs' | 'testURI'>;
}
/**
 * Test an audio output device and measures the volume.
 * @param options
 */
export declare function testOutputDevice(options?: OutputTest.Options): OutputTest;
