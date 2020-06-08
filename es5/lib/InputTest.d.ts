/// <reference types="node" />
import { EventEmitter } from 'events';
import { TestNames } from './constants';
import { DiagnosticError } from './errors';
import { SubsetRequired, TimeMeasurement } from './types';
export declare interface InputTest {
    /**
     * This event is emitted with a boolean representing if the test passed and a
     * test report when the test ends.
     * @param event [[InputTest.Events.End]]
     * @param report Summary of the test.
     * @private
     */
    emit(event: InputTest.Events.End, report: InputTest.Report): boolean;
    /**
     * This event is emitted with a [[DiagnosticError]] when the test encounters
     * an error, fatal or not.
     * @param event [[InputTest.Events.Error]]
     * @param error The [[DiagnosticError]] that was encountered.
     * @private
     */
    emit(event: InputTest.Events.Error, error: DiagnosticError): boolean;
    /**
     * This event is emitted with a volume level every
     * [[InputTest.Options.volumeEventIntervalMs]] after the test starts succesfully.
     * @param event [[InputTest.Events.Volume]]
     * @param value The current volume of the audio source.
     * @private
     */
    emit(event: InputTest.Events.Volume, value: number): boolean;
    /**
     * Raised upon completion of the test.
     * @param event [[InputTest.Events.End]]
     * @param listener A callback that expects the following parameters:
     *  An [[InputTest.Report]] that summarizes the test.
     * @returns This [[InputTest]] instance.
     * @event
     */
    on(event: InputTest.Events.End, listener: (report: InputTest.Report) => any): this;
    /**
     * Raised by the test when encountering an error with a parameter of type
     * [[DiagnosticError]].
     * @param event [[InputTest.Events.Error]]
     * @param listener A callback that expects the following parameters:
     *  A [[DiagnosticError]] that the test encountered.
     * @returns This [[InputTest]] instance.
     * @event
     */
    on(event: InputTest.Events.Error, listener: (error: DiagnosticError) => any): this;
    /**
     * Raised by the test every [[Options.volumeEventIntervalMs]] amount of
     * milliseconds with a parameter of type `number` that represents the
     * current volume of the audio stream.
     * @param event [[InputTest.Events.Volume]]
     * @param listener A callback that expects the following parameters:
     *  A `number` that represents the audio source's current volume.
     * @returns This [[InputTest]] instance.
     * @event
     */
    on(event: InputTest.Events.Volume, listener: (value: number) => any): this;
}
/**
 * [[InputTest]] class that parses options and starts an audio input device
 * test.
 *
 * Please see [[testInputDevice]] for details and recommended practices.
 */
export declare class InputTest extends EventEmitter {
    /**
     * Name of the test.
     */
    static testName: TestNames.InputAudioDevice;
    /**
     * Default options for the `InputTest`.
     */
    private static defaultOptions;
    /**
     * An `AudioContext` to use for generating volume levels.
     */
    private _audioContext;
    /**
     * A function that will be assigned in `_startTest` that when run will clean
     * up the audio nodes created in the same function.
     */
    private _cleanupAudio;
    /**
     * The default media devices when starting the test.
     */
    private _defaultDevices;
    /**
     * A timestamp that is set when the test ends.
     */
    private _endTime;
    /**
     * An array of any errors that occur during the run time of the test.
     */
    private readonly _errors;
    /**
     * The maximum volume level from the audio source.
     */
    private _maxValue;
    /**
     * A `MediaStream` that is created from the input device.
     */
    private _mediaStream;
    /**
     * Options that are passed to and set in the constructor for use during the
     * test.
     */
    private _options;
    /**
     * A timestamp that is set when the test starts after a successful call to getUserMedia.
     */
    private _startTime;
    /**
     * Volume levels generated from the audio source during the run time of the
     * test.
     */
    private readonly _values;
    /**
     * The timeout that causes the volume event to loop; created by `setTimeout`.
     */
    private _volumeTimeout;
    /**
     * Initializes the `startTime` and `options`.
     * @param options Optional settings to pass to the test.
     */
    constructor(options?: InputTest.Options);
    /**
     * Stop the currently running `InputTest`.
     * @param pass whether or not the test should pass. If set to false, will
     * override the result from determining whether audio is silent from the collected volume levels.
     */
    stop(pass?: boolean): InputTest.Report | undefined;
    /**
     * Clean up any instantiated objects (i.e. `AudioContext`, `MediaStreams`,
     * etc.).
     * Called by `.stop`.
     */
    private _cleanup;
    /**
     * Helper function that should be called when an error occurs, recoverable
     * or not.
     * @param error
     */
    private _onError;
    /**
     * Called every `InputTest._options.volumeEventIntervalMs` amount of
     * milliseconds, emits the volume passed to it as a `Events.Volume` event.
     * @param value the volume
     */
    private _onVolume;
    /**
     * Warning event handler.
     * @param warning
     */
    private _onWarning;
    /**
     * Entry point into the input device test. Uses the `MediaStream` that the
     * object was set up with, and performs a fourier transform on the audio data
     * using an `AnalyserNode`. The output of the fourier transform are the
     * relative amplitudes of the frequencies of the audio data. The average of
     * this data can then be used as an estimate as the average volume of the
     * entire volume source.
     *
     * @event Events.Volume
     */
    private _startTest;
}
export declare namespace InputTest {
    /**
     * Possible events that an `InputTest` might emit. See [[InputTest.on]].
     */
    enum Events {
        End = "end",
        Error = "error",
        Volume = "volume"
    }
    /**
     * Represents the report generated from an [[InputTest]].
     */
    interface Report {
        /**
         * The device ID used to get a MediaStream from using [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
         */
        deviceId: MediaTrackConstraintSet['deviceId'];
        /**
         * Whether or not the test passed. This is `true` if no errors were detected or if the volumes are not silent.
         */
        didPass: boolean;
        /**
         * Any errors that occurred during the test.
         */
        errors: DiagnosticError[];
        /**
         * The name of the test.
         */
        testName: typeof InputTest.testName;
        /**
         * Time measurements of test run time.
         */
        testTiming?: TimeMeasurement;
        /**
         * The volume levels emitted by the test during its run-time.
         */
        values: number[];
    }
    /**
     * Options passed to [[InputTest]] constructor.
     */
    interface Options {
        /**
         * AudioContext mock to be used during the test.
         * @private
         */
        audioContextFactory?: typeof window.AudioContext;
        /**
         * Whether or not to log debug statements to the console.
         * @private
         */
        debug?: boolean;
        /**
         * The device ID to try to get a MediaStream from using [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
         */
        deviceId?: MediaTrackConstraintSet['deviceId'];
        /**
         * Duration of time to run the test in ms.
         * @default Infinity
         */
        duration?: number;
        /**
         * Used to mock the call to `enumerateDevices`.
         * @private
         */
        enumerateDevices?: typeof navigator.mediaDevices.enumerateDevices;
        /**
         * Used to mock calls to `getUserMedia`.
         * @private
         */
        getUserMedia?: typeof window.navigator.mediaDevices.getUserMedia;
        /**
         * The interval between emissions of volume events in milliseconds.
         * @default 100
         */
        volumeEventIntervalMs?: number;
    }
    /**
     * Option typing after initialization, so we can have type guarantees.
     * @private
     */
    type InternalOptions = SubsetRequired<Options, 'duration' | 'volumeEventIntervalMs'>;
}
/**
 * [[InputTest]] tests audio input capabilities. It serves to help diagnose
 * potential audio device issues that would prevent audio from being recognized
 * in a WebRTC call.
 *
 * ---
 *
 * The [[InputTest]] class is an `EventEmitter` (please see [[InputTest.on]] for
 * events and their details) and helps to diagnose issues by capturing user
 * audio and emitting the volume levels detected in that media.
 * ```ts
 * import { InputTest, testInputDevice } from '@twilio/rtc-diagnostics';
 * const options: InputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const inputTest: InputTest = testInputDevice(options);
 * ```
 * Applications can use the volume events emitted by the test to update their UI
 * to show to the user whether or not their media was captured successfully.
 * ```ts
 * inputTest.on(InputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 * The test can be normally stopped two ways: allowing the test to time out and
 * stopping the test manually.
 *
 * If the test was allowed to time out, the value of
 * [[InputTest.Report.didPass]] will be determined by the ratio of silent volume
 * values in the captured media.
 *
 * To end the test manually, the application can ask the end-user to confirm
 * that the volume levels it emits are what the end-user expects. If so, the
 * application can call the [[InputTest.stop]] method with `true`. Otherwise,
 * if the audio values are not expected, the application can call
 * [[InputTest.stop]] with `false`.
 * ```ts
 * // The UI should indicate that if the volume values are what the user
 * // expects, they can click this button to pass and stop the test...
 * const volumeCorrectButton = ...;
 * volumeCorrectButton.addEventListener('click', () => {
 *   inputTest.stop(true);
 * });
 *
 * // ...otherwise, if the volume levels are not what they expect, they can
 * // click this.
 * const volumeIncorrectButton = ...;
 * volumeIncorrectButton.addEventListener('click', () => {
 *   inputTest.stop(false);
 * });
 * ```
 * Calling [[InputTest.stop]] will immediately end the test. The value of
 * [[InputTest.Report.didPass]] is determined from the ratio of silent audio
 * levels detected in the user media, but overwritten by passing `false` to
 * [[InputTest.stop]].
 *
 * ---
 *
 * The [[InputTest]] object will always emit a [[InputTest.Report]] with the
 * [[InputTest.Events.End]] event, regardless of the occurrence of errors during
 * the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that the
 * value of [[InputTest.Report.didPass]] will be `false` and the value of
 * [[InputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[InputTest.Report.errors]] upon completion of the test.
 *
 * ---
 *
 * The function [[testInputDevice]] serves as a factory function that accepts
 * [[InputTest.Options]] as its only parameter and will instantiate an
 * [[InputTest]] object with those options.
 * ```ts
 * import { InputTest, testInputDevice } from '@twilio/rtc-diagnostics';
 * const options: InputTest.Options = { ... };
 * const inputTest: InputTest = testInputDevice(options);
 * ```
 *
 * @param options Options to pass to the [[InputTest]] constructor.
 */
export declare function testInputDevice(options?: InputTest.Options): InputTest;
