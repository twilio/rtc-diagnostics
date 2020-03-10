import { EventEmitter } from 'events';
import { INCOMING_SOUND_URL, TestNames } from './constants';
import {
  AlreadyStoppedError,
  DiagnosticError,
  InvalidOptionsError,
  UnsupportedError,
} from './errors';
import {
  Audio,
  AudioContext,
  AudioContextUnsupportedError,
  AudioUnsupportedError,
  enumerateDevices,
} from './polyfills';
import { getDefaultDevices } from './polyfills/enumerateDevices';
import { AudioElement, TimeMeasurement } from './types';
import { detectSilence } from './utils';
import {
  InvalidityRecord,
  validateDeviceId,
  validateOptions,
  validateTime,
} from './utils/optionValidation';

export declare interface OutputTest {
  /**
   * This event is emitted when the test ends.
   * @param event [[OutputTest.Events.End]]
   * @param didPass A boolean representing the passing state of the test.
   * @param report A summary of the test.
   * @private
   */
  emit(
    event: OutputTest.Events.End,
    didPass: boolean,
    report: OutputTest.Report,
  ): boolean;
  /**
   * This event is emitted when the test encounters an error, fatal or not.
   * @param event [[OutputTest.Events.Error]]
   * @param error An error that was encountered during the run time of the test.
   * @private
   */
  emit(
    event: OutputTest.Events.Error,
    error: DiagnosticError,
  ): boolean;
  /**
   * This event is emitted by the test after succesfully starting, and emits
   * the volume of the audio source every [[OutputTest.Options.pollIntervalMs]]
   * milliseconds.
   * @param event [[OutputTest.Events.Volume]]
   * @param value The volume of the audio source.
   * @private
   */
  emit(
    event: OutputTest.Events.Volume,
    value: number,
  ): boolean;

  /**
   * Raised when the test ends. The stop condition depends on if the option
   * to loop was set to `true` or `false`. If `false`, then the test ends either
   * when the audio file is finished playing, or when a time has elapsed
   * greater than [[OutputTest.Options.duration]].
   * @event
   * @param event [[OutputTest.Events.End]]
   * @param listener A listener function that expects the following parameters
   * when the event is raised:
   * - A boolean representing whether or not the test passed.
   * - A [[OutputTest.Report]] that summarizes the run time of the test.
   * @returns This [[OutputTest]] instance.
   */
  on(
    event: OutputTest.Events.End,
    listener: (didPass: boolean, report: OutputTest.Report) => any,
  ): this;
  /**
   * Raised when the test has run into an error, fatal or not.
   * @event
   * @param event [[OutputTest.Events.Error]]
   * @param listener A listener function that expects the following parameters
   * when the event is raised:
   * - The [[DiagnosticError]].
   * @returns This [[OutputTest]] instance.
   */
  on(
    event: OutputTest.Events.Error,
    listener: (error: DiagnosticError) => any,
  ): this;
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
  on(
    event: OutputTest.Events.Volume,
    listener: (value: number) => any,
  ): this;
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
export class OutputTest extends EventEmitter {
  /**
   * Default options for the [[OutputTest]]. Overwritten by any option passed
   * during the construction of the test.
   */
  static defaultOptions: OutputTest.Options = {
    audioContextFactory: AudioContext,
    audioElementFactory: Audio,
    debug: false,
    doLoop: true,
    duration: Infinity,
    enumerateDevices,
    passOnTimeout: true,
    pollIntervalMs: 100,
    testURI: INCOMING_SOUND_URL,
  };
  /**
   * The name of the test.
   */
  static testName: TestNames.OutputAudioDevice = TestNames.OutputAudioDevice;

  /**
   * An `AudioContext` that is used to process the audio source.
   */
  private _audioContext: AudioContext | null = null;
  /**
   * An `AudioElement` that is attached to the DOM to play audio.
   */
  private _audioElement: AudioElement | null = null;
  /**
   * The default media devices when starting the test.
   */
  private _defaultDevices: Partial<Record<
    MediaDeviceKind,
    MediaDeviceInfo
  >> = {};
  /**
   * A timestamp of when the test ends.
   */
  private _endTime: number | null = null;
  /**
   * An array of errors encountered by the test during its run time.
   */
  private readonly _errors: DiagnosticError[] = [];
  /**
   * Options passed to and set in the constructor to be used during the run
   * time of the test.
   */
  private _options: OutputTest.Options;
  /**
   * A Promise that resolves when the `AudioElement` successfully starts playing
   * audio. Will reject if not possible.
   */
  private _playPromise: Promise<void> | null = null;
  /**
   * A timestamp of when the test starts. This is set in the constructor and not
   * when the test succesfully starts.
   */
  private _startTime: number;
  /**
   * Volume values generated by the test over its run time.
   */
  private readonly _values: number[] = [];
  /**
   * Timeout created by `setTimeout`, used to loop the volume logic.
   */
  private _volumeTimeout: NodeJS.Timeout | null = null;

  /**
   * Sets up several things for the `OutputTest` to run later in the
   * `_startTest` function.
   * An `AudioContext` is created if none is passed in the `options` parameter
   * and the `_startTime` is immediately set.
   * @param options
   */
  constructor(options: Partial<OutputTest.Options> = {}) {
    super();

    this._options = { ...OutputTest.defaultOptions, ...options };

    this._startTime = Date.now();

    // We need to use a `setTimeout` here to prevent a race condition.
    // This allows event listeners to bind before the test starts.
    setTimeout(() => this._startTest());
  }

  /**
   * Stops the test.
   * @param pass whether or not the test should pass. If set to false, will
   * override the result from determining whether audio is silent from the collected volume values.
   */
  stop(pass: boolean = true): OutputTest.Report | undefined {
    if (this._endTime) {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    // Clean up the test.
    this._cleanup();

    this._endTime = Date.now();
    const report: OutputTest.Report = {
      deviceId: this._options.deviceId || (
        this._defaultDevices.audiooutput &&
        this._defaultDevices.audiooutput.deviceId
      ),
      didPass: pass && !detectSilence(this._values),
      errors: this._errors,
      testName: OutputTest.testName,
      testTiming: {
        duration: this._endTime - this._startTime,
        end: this._endTime,
        start: this._startTime,
      },
      testURI: this._options.testURI,
      values: this._values,
    };
    this.emit(OutputTest.Events.End, report.didPass, report);

    return report;
  }

  /**
   * Cleanup the test.
   */
  private _cleanup(): void {
    if (this._volumeTimeout) {
      clearTimeout(this._volumeTimeout);
    }
    if (this._audioContext) {
      this._audioContext.close();
    }
    if (this._playPromise) {
      this._playPromise.then(() => {
        // we need to try to wait for the call to play to finish before we can
        // pause the audio
        if (this._audioElement) {
          this._audioElement.pause();
        }
      }).catch(() => {
        // this means play errored out so we do nothing
      });
    }
  }

  /**
   * Error event handler. Adds the error to the internal list of errors that is
   * forwarded in the report.
   * @param error
   */
  private _onError(error: DiagnosticError): void {
    this._errors.push(error);
    this.emit(OutputTest.Events.Error, error);
  }

  /**
   * Volume event handler, adds the value to the list `_values` and emits it
   * under the event `volume`.
   * @param volume
   */
  private _onVolume(volume: number): void {
    this._values.push(volume);
    this.emit(OutputTest.Events.Volume, volume);
  }

  /**
   * Warning event handler.
   * @param warning
   */
  private _onWarning(error: DiagnosticError): void {
    if (this._options.debug) {
      // tslint:disable-next-line no-console
      console.warn(error);
    }
  }

  /**
   * Entry point of the test, called after setup in the constructor.
   * Emits the volume levels of the audio.
   * @event `OutputTest.Events.Volume`
   */
  private async _startTest(): Promise<void> {
    try {
      // Try to validate all of the inputs before starting the test.
      // We perform this check here so if the validation throws, it gets handled
      // properly as a fatal-error and we still emit a report with that error.
      const invalidReasons: InvalidityRecord<OutputTest.Options> | undefined =
        await validateOptions<OutputTest.Options>(this._options, {
          deviceId: validateDeviceId,
          duration: validateTime,
          pollIntervalMs: validateTime,
        });

      if (invalidReasons) {
        throw new InvalidOptionsError(invalidReasons);
      }

      if (!this._options.audioContextFactory) {
        throw AudioContextUnsupportedError;
      }
      this._audioContext = new this._options.audioContextFactory();

      if (!this._options.audioElementFactory) {
        throw AudioUnsupportedError;
      }
      this._audioElement =
        new this._options.audioElementFactory(this._options.testURI);
      this._audioElement.setAttribute('crossorigin', 'anonymous');
      this._audioElement.loop = this._options.doLoop;

      if (this._options.deviceId) {
        if (this._audioElement.setSinkId) {
          await this._audioElement.setSinkId(this._options.deviceId);
        } else {
          // Non-fatal error
          this._onError(new UnsupportedError(
            'A `deviceId` was passed to the `OutputTest` but `setSinkId` is ' +
            'not supported in this browser.',
          ));
        }
      }

      const source: MediaElementAudioSourceNode =
        this._audioContext.createMediaElementSource(this._audioElement);
      source.connect(this._audioContext.destination);

      const analyser: AnalyserNode = this._audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.4;
      analyser.fftSize = 64;
      source.connect(analyser);

      const frequencyDataBytes: Uint8Array =
        new Uint8Array(analyser.frequencyBinCount);
      const volumeEvent: () => void = (): void => {
        if (this._endTime) {
          return;
        }

        analyser.getByteFrequencyData(frequencyDataBytes);
        const volume: number =
          frequencyDataBytes.reduce(
            (sum: number, val: number) => sum + val,
            0,
          ) / frequencyDataBytes.length;
        this._onVolume(volume);

        // Check stop conditions
        const isTimedOut: boolean =
          Date.now() - this._startTime > this._options.duration;
        const stop: boolean = this._options.doLoop
          ? isTimedOut
          : (this._audioElement && this._audioElement.ended) || isTimedOut;

        if (stop) {
          if (this._options.passOnTimeout === false) {
            this._onError(new DiagnosticError(
              undefined,
              'Test timed out.',
            ));
          }
          this.stop(this._options.passOnTimeout);
        } else {
          this._volumeTimeout = setTimeout(
            volumeEvent,
            this._options.pollIntervalMs,
          );
        }
      };

      this._playPromise = this._audioElement.play();
      await this._playPromise;

      this._defaultDevices = await getDefaultDevices();

      this._volumeTimeout = setTimeout(
        volumeEvent,
        this._options.pollIntervalMs,
      );
    } catch (error) {
      if (error instanceof DiagnosticError) {
        this._onError(error);
      } else if (
        typeof DOMException !== 'undefined' && error instanceof DOMException
      ) {
        this._onError(new DiagnosticError(
          error,
          'A DOMException has occurred.',
        ));
      } else if (
        typeof DOMError !== 'undefined' && error instanceof DOMError
      ) {
        this._onError(new DiagnosticError(
          error,
          'A DOMError has occurred.',
        ));
      } else {
        this._onError(new DiagnosticError(
          undefined,
          'Unknown error occurred.',
        ));
        this._onWarning(error);
      }
      this.stop(false);
    }
  }
}

export namespace OutputTest {
  /**
   * Events that the OutputTest will emit as it runs.
   * Please see [[OutputTest.on]] for how to listen to these
   * events.
   */
  export enum Events {
    End = 'end',
    Error = 'error',
    Volume = 'volume',
  }

  /**
   * Options passed to [[OutputTest]] constructor.
   */
  export interface Options {
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
    debug: boolean;

    /**
     * The `deviceId` of the audio device to attempt to play audio out of.
     * This option is directly passed to [HTMLMediaElement.setSinkId](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
     */
    deviceId?: string;

    /**
     * Whether or not to loop the audio.
     * See [[OutputTest]] for details on the behavior of "timing out".
     */
    doLoop: boolean;

    /**
     * Duration in milliseconds to run the test for. If this amount of time elapses, the test
     * is considered "timed out".
     * See [[OutputTest]] for details on the behavior of "timing out".
     */
    duration: number;

    /**
     * Used to mock the call to `enumerateDevices`.
     * @private
     */
    enumerateDevices?: typeof navigator.mediaDevices.enumerateDevices;

    /**
     * Set [[OutputTest.Report.didPass]] to true or not upon test timeout.
     * See [[OutputTest]] for details on the behavior of "timing out".
     */
    passOnTimeout: boolean;

    /**
     * The polling rate to emit volume events in milliseconds.
     */
    pollIntervalMs: number;

    /**
     * The URI of the audio file to use for the test.
     */
    testURI: string;
  }

  /**
   * The test summary that is emitted when the OutputTest ends with event
   * [[OutputTest.Events.End]].
   */
  export interface Report {
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
    testURI: string;

    /**
     * The volume values emitted by the test during its run-time.
     */
    values: number[];
  }
}

/**
 * Test an audio output device and measures the volume.
 * @param deviceId
 * @param options
 */
export function testOutputDevice(): OutputTest;

export function testOutputDevice(
  deviceId: string | undefined,
  options?: Partial<OutputTest.Options>,
): OutputTest;

export function testOutputDevice(
  deviceId?: string,
  options: Partial<OutputTest.Options> = {},
): OutputTest {
  return new OutputTest({ ...options, deviceId });
}
