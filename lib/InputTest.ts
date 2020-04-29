import { EventEmitter } from 'events';
import { TestNames } from './constants';
import {
  AlreadyStoppedError,
  DiagnosticError,
  InvalidOptionsError,
} from './errors';
import {
  AudioContext,
  AudioContextUnsupportedError,
  enumerateDevices,
  getDefaultDevices,
  getUserMedia,
  GetUserMediaUnsupportedError,
} from './polyfills';
import { SubsetRequired, TimeMeasurement } from './types';
import { detectSilence } from './utils';
import {
  InvalidityRecord,
  validateDeviceId,
  validateOptions,
  validateTime,
} from './utils/optionValidation';

export declare interface InputTest {
  /**
   * This event is emitted with a boolean representing if the test passed and a
   * test report when the test ends.
   * @param event [[InputTest.Events.End]]
   * @param report Summary of the test.
   * @private
   */
  emit(
    event: InputTest.Events.End,
    report: InputTest.Report,
  ): boolean;
  /**
   * This event is emitted with a [[DiagnosticError]] when the test encounters
   * an error, fatal or not.
   * @param event [[InputTest.Events.Error]]
   * @param error The [[DiagnosticError]] that was encountered.
   * @private
   */
  emit(
    event: InputTest.Events.Error,
    error: DiagnosticError,
  ): boolean;
  /**
   * This event is emitted with a volume level every
   * [[InputTest.Options.pollIntervalMs]] after the test starts succesfully.
   * @param event [[InputTest.Events.Volume]]
   * @param value The current volume of the audio source.
   * @private
   */
  emit(
    event: InputTest.Events.Volume,
    value: number,
  ): boolean;

  /**
   * Raised upon completion of the test.
   * @param event [[InputTest.Events.End]]
   * @param listener A callback that expects the following parameters:
   *  An [[InputTest.Report]] that summarizes the test.
   * @returns This [[InputTest]] instance.
   * @event
   */
  on(
    event: InputTest.Events.End,
    listener: (report: InputTest.Report) => any,
  ): this;
  /**
   * Raised by the test when encountering an error with a parameter of type
   * [[DiagnosticError]].
   * @param event [[InputTest.Events.Error]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticError]] that the test encountered.
   * @returns This [[InputTest]] instance.
   * @event
   */
  on(
    event: InputTest.Events.Error,
    listener: (error: DiagnosticError) => any,
  ): this;
  /**
   * Raised by the test every [[Options.pollIntervalMs]] amount of
   * milliseconds with a parameter of type `number` that represents the
   * current volume of the audio stream.
   * @param event [[InputTest.Events.Volume]]
   * @param listener A callback that expects the following parameters:
   *  A `number` that represents the audio source's current volume.
   * @returns This [[InputTest]] instance.
   * @event
   */
  on(
    event: InputTest.Events.Volume,
    listener: (value: number) => any,
  ): this;
}

/**
 * Supervises an input device test utilizing a `MediaStream` passed to it, or an
 * input `MediaStream` obtained from `getUserMedia` if no `MediaStream` was
 * passed via `options`.
 * The events defined in the enum [[Events]] are emitted as the test
 * runs.
 */
export class InputTest extends EventEmitter {
  /**
   * Name of the test.
   */
  static testName: TestNames.InputAudioDevice = TestNames.InputAudioDevice;

  /**
   * Default options for the `InputTest`.
   */
  private static defaultOptions: InputTest.InternalOptions = {
    audioContextFactory: AudioContext,
    debug: false,
    duration: Infinity,
    enumerateDevices,
    getUserMedia,
    pollIntervalMs: 100,
  };

  /**
   * An `AudioContext` to use for generating volume levels.
   */
  private _audioContext: AudioContext | null = null;
  /**
   * A function that will be assigned in `_startTest` that when run will clean
   * up the audio nodes created in the same function.
   */
  private _cleanupAudio: (() => void) | null = null;
  /**
   * The default media devices when starting the test.
   */
  private _defaultDevices: Partial<Record<
    MediaDeviceKind,
    MediaDeviceInfo
  >> = {};
  /**
   * A timestamp that is set when the test ends.
   */
  private _endTime: number | null = null;
  /**
   * An array of any errors that occur during the run time of the test.
   */
  private readonly _errors: DiagnosticError[] = [];
  /**
   * The maximum volume level from the audio source.
   */
  private _maxValue: number = 0;
  /**
   * A `MediaStream` that is created from the input device.
   */
  private _mediaStream: MediaStream | null = null;
  /**
   * Options that are passed to and set in the constructor for use during the
   * test.
   */
  private _options: InputTest.InternalOptions;
  /**
   * A timestamp that is set when the test starts after a successful call to getUserMedia.
   */
  private _startTime: number | undefined;
  /**
   * Volume levels generated from the audio source during the run time of the
   * test.
   */
  private readonly _values: number[] = [];
  /**
   * The timeout that causes the volume event to loop; created by `setTimeout`.
   */
  private _volumeTimeout: NodeJS.Timeout | null = null;

  /**
   * Initializes the `startTime` and `options`.
   * @param options Optional settings to pass to the test.
   */
  constructor(options?: InputTest.Options) {
    super();

    this._options = { ...InputTest.defaultOptions, ...options };

    // We need to use a `setTimeout` here to prevent a race condition.
    // This allows event listeners to bind before the test starts.
    setTimeout(() => this._startTest());
  }

  /**
   * Stop the currently running `InputTest`.
   * @param pass whether or not the test should pass. If set to false, will
   * override the result from determining whether audio is silent from the collected volume levels.
   */
  stop(pass: boolean = true): InputTest.Report | undefined {
    if (this._endTime) {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    // Perform cleanup
    this._cleanup();

    this._endTime = Date.now();
    const didPass: boolean = pass && !detectSilence(this._values);
    const report: InputTest.Report = {
      deviceId: this._options.deviceId || (
        this._defaultDevices.audioinput &&
        this._defaultDevices.audioinput.deviceId
      ),
      didPass,
      errors: this._errors,
      testName: InputTest.testName,
      values: this._values,
    };

    if (this._startTime) {
      report.testTiming = {
        duration: this._endTime - this._startTime,
        end: this._endTime,
        start: this._startTime,
      };
    }

    this.emit(InputTest.Events.End, report);

    return report;
  }

  /**
   * Clean up any instantiated objects (i.e. `AudioContext`, `MediaStreams`,
   * etc.).
   * Called by `.stop`.
   */
  private _cleanup(): void {
    if (this._volumeTimeout) {
      clearTimeout(this._volumeTimeout);
    }
    if (this._cleanupAudio) {
      this._cleanupAudio();
    }
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(
        (track: MediaStreamTrack) => track.stop(),
      );
    }
    if (this._audioContext) {
      this._audioContext.close();
    }
  }

  /**
   * Helper function that should be called when an error occurs, recoverable
   * or not.
   * @param error
   */
  private _onError(error: DiagnosticError): void {
    this._errors.push(error);
    this.emit(InputTest.Events.Error, error);
  }

  /**
   * Called every `InputTest._options.pollingRate` ms, emits the volume passed
   * to it as a `Events.Volume` event.
   * @param value the volume
   */
  private _onVolume(value: number): void {
    if (value > this._maxValue) {
      this._maxValue = value;
    }
    this._values.push(value);
    this.emit(InputTest.Events.Volume, value);
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
   * Entry point into the input device test. Uses the `MediaStream` that the
   * object was set up with, and performs a fourier transform on the audio data
   * using an `AnalyserNode`. The output of the fourier transform are the
   * relative amplitudes of the frequencies of the audio data. The average of
   * this data can then be used as an estimate as the average volume of the
   * entire volume source.
   *
   * @event Events.Volume
   */
  private async _startTest(): Promise<void> {
    try {
      // Try to validate all of the inputs before starting the test.
      // We perform this check here so if the validation throws, it gets handled
      // properly as a fatal-error and we still emit a report with that error.
      const invalidReasons: InvalidityRecord<InputTest.Options> | undefined =
        await validateOptions<InputTest.Options>(this._options, {
          deviceId: validateDeviceId,
          duration: validateTime,
          pollIntervalMs: validateTime,
        });
      if (invalidReasons) {
        throw new InvalidOptionsError(invalidReasons);
      }

      if (!this._options.getUserMedia) {
        throw GetUserMediaUnsupportedError;
      }
      this._mediaStream = await this._options.getUserMedia({
        audio: { deviceId: this._options.deviceId },
      });

      this._defaultDevices = await getDefaultDevices();

      // Only starts the timer after successfully getting devices
      this._startTime = Date.now();

      if (!this._options.audioContextFactory) {
        throw AudioContextUnsupportedError;
      }
      this._audioContext = new this._options.audioContextFactory();

      const analyser: AnalyserNode = this._audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.4;
      analyser.fftSize = 64;

      const microphone: MediaStreamAudioSourceNode =
        this._audioContext.createMediaStreamSource(this._mediaStream);
      microphone.connect(analyser);

      this._cleanupAudio = (): void => {
        analyser.disconnect();
        microphone.disconnect();
      };

      const frequencyDataBytes: Uint8Array =
        new Uint8Array(analyser.frequencyBinCount);

      // This function runs every `this._options.reportRate` ms and emits the
      // current volume of the `MediaStream`.
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

        if (Date.now() - this._startTime! > this._options.duration) {
          this.stop();
        } else {
          this._volumeTimeout = setTimeout(
            volumeEvent,
            this._options.pollIntervalMs,
          );
        }
      };

      this._volumeTimeout = setTimeout(
        volumeEvent,
        this._options.pollIntervalMs,
      );
    } catch (error) {
      if (error instanceof DiagnosticError) {
        // There is some other fatal error.
        this._onError(error);
      } else if (
        typeof DOMException !== 'undefined' && error instanceof DOMException
      ) {
        this._onError(new DiagnosticError(
          error,
          'A `DOMException` has occurred.',
        ));
      } else if (
        typeof DOMError !== 'undefined' && error instanceof DOMError
      ) {
        this._onError(new DiagnosticError(
          error,
          'A `DOMError` has occurred.',
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

export namespace InputTest {
  /**
   * Possible events that an `InputTest` might emit. See [[InputTest.on]].
   */
  export enum Events {
    End = 'end',
    Error = 'error',
    Volume = 'volume',
  }

  /**
   * Represents the report generated from an [[InputTest]].
   */
  export interface Report {
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
  export interface Options {
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
     * The polling rate to emit volume events in milliseconds.
     * @default 100
     */
    pollIntervalMs?: number;
  }

  /**
   * Option typing after initialization, so we can have type guarantees.
   * @private
   */
  export type InternalOptions = SubsetRequired<Options, 'duration' | 'pollIntervalMs'>;
}

/**
 * Test an audio input device and measures the volume.
 * @param options
 */
export function testInputDevice(
  options?: InputTest.Options,
): InputTest {
  return new InputTest(options);
}
