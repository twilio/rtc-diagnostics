import { EventEmitter } from 'events';
import { TestName, WarningName } from './constants';
import {
  AlreadyStoppedError,
  DiagnosticError,
  InvalidOptionsError,
} from './errors';
import {
  AudioContext,
  AudioContextUnsupportedError,
  Blob,
  BlobUnsupportedError,
  createObjectURL,
  createObjectURLUnsupportedError,
  enumerateDevices,
  EnumerateDevicesUnsupportedError,
  getDefaultDevices,
  getUserMedia,
  GetUserMediaUnsupportedError,
  MediaRecorder,
  MediaRecorderUnsupportedError,
} from './polyfills';
import { SubsetRequired, TimeMeasurement, VolumeStats } from './types';
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
   * [[InputTest.Options.volumeEventIntervalMs]] after the test starts succesfully.
   * @param event [[InputTest.Events.Volume]]
   * @param value The current volume of the audio source.
   * @private
   */
  emit(
    event: InputTest.Events.Volume,
    value: number,
  ): boolean;
  /**
   * This event is emitted when the test encounters a non-fatal warning during
   * its run-time.
   * @param event [[InputTest.Events.Warning]]
   * @param warning The warning that the test encountered.
   * @private
   */
  emit(
    event: InputTest.Events.Warning,
    warning: WarningName,
  ): boolean;
  /**
   * This event is emitted when the test clears a previously encountered
   * non-fatal warning during its run-time.
   * @param event [[InputTest.Events.WarningCleared]]
   * @param warning The warning that the test encountered that should be cleared.
   * @private
   */
  emit(
    event: InputTest.Events.WarningCleared,
    warning: WarningName,
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
   * Raised by the test every [[Options.volumeEventIntervalMs]] amount of
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
  /**
   * Raised by the test when the test encounters a non-fatal warning during
   * its run-time.
   * @param event [[InputTest.Events.Warning]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticWarning]].
   * @returns This [[InputTest]] instance.
   * @event
   */
  on(
    event: InputTest.Events.Warning,
    listener: (warning: WarningName) => any,
  ): this;
  /**
   * Raised by the test when the test clears a previously encountered non-fatal
   * warning during its run-time.
   * @param event [[InputTest.Events.WarningCleared]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticWarning]] name.
   * @returns This [[InputTest]] instance.
   * @event
   */
  on(
    event: InputTest.Events.WarningCleared,
    listener: (warning: WarningName) => any,
  ): this;
}

/**
 * [[InputTest]] class that parses options and starts an audio input device
 * test.
 *
 * Please see [[testInputDevice]] for details and recommended practices.
 */
export class InputTest extends EventEmitter {
  /**
   * Name of the test.
   */
  static testName: TestName.InputAudioDevice = TestName.InputAudioDevice;

  /**
   * Default options for the `InputTest`.
   */
  private static defaultOptions: InputTest.InternalOptions = {
    audioContextFactory: AudioContext,
    blobFactory: Blob,
    createObjectURL,
    debug: false,
    duration: Infinity,
    enumerateDevices,
    getUserMedia,
    mediaRecorderFactory: MediaRecorder,
    volumeEventIntervalMs: 100,
  };

  /**
   * Active warnings to keep track of.
   */
  readonly activeWarnings: Set<WarningName> = new Set();

  /**
   * List of audio `blob` objects saved by the test.
   */
  private _audioBlobs: Blob[] = [];
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
   * A `MediaRecorder` that is used to save captured audio.
   */
  private _mediaRecorder: MediaRecorder | null = null;
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
  private readonly _volumeStats: VolumeStats = {
    timestamps: [],
    values: [],
  };
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
    if (typeof this._endTime === 'number') {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    // Perform cleanup
    this._cleanup();

    const recordingUrl: string | undefined =
      this._audioBlobs.length &&
      this._options.createObjectURL &&
      this._options.blobFactory
        ? this._options.createObjectURL(new this._options.blobFactory(
            this._audioBlobs, {
              type: this._audioBlobs[0].type,
            }),
          )
        : undefined;

    this._endTime = Date.now();
    const didPass: boolean = pass && !detectSilence(this._volumeStats.values);
    const report: InputTest.Report = {
      deviceId: this._options.deviceId || (
        this._defaultDevices.audioinput &&
        this._defaultDevices.audioinput.deviceId
      ),
      didPass,
      errors: this._errors,
      testName: InputTest.testName,
      values: this._volumeStats.values,
      ...recordingUrl && { recordingUrl },
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
    this._mediaRecorder?.stop();
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
   * Called every `InputTest._options.volumeEventIntervalMs` amount of
   * milliseconds, emits the volume passed to it as a `Events.Volume` event.
   * @param value the volume
   */
  private _onVolume(value: number): void {
    const now = Date.now();

    if (!this._volumeStats.max || value > this._volumeStats.max) {
      this._volumeStats.max = value;
    }
    this._volumeStats.values.push(value);
    this._volumeStats.timestamps.push(now);
    this.emit(InputTest.Events.Volume, value);

    // Find the last 3 seconds worth of volume values.
    const startIndex = this._volumeStats.timestamps.findIndex(
      (timestamp: number) => now - timestamp <= 3000,
    );

    // We want to do nothing at 1 and not 0 here because this guarantees that
    // there is at least one timestamp before the sample set. This means that
    // there are at least three seconds of samples.
    if (startIndex < 1) {
      return;
    }

    const samples = this._volumeStats.values.slice(
      startIndex > 0
        ? startIndex
        : 0,
    );

    // Calculate the standard deviation of the sample set.
    const sampleAverage = samples.reduce(
      (sample: number, partialSum: number) => sample + partialSum,
      0,
    ) / samples.length;
    const diffSquared = samples.map(
      (sample: number) => Math.pow(sample - sampleAverage, 2),
    );
    const stdDev = Math.sqrt(diffSquared.reduce(
      (sample: number, partialSum: number) => sample + partialSum,
      0,
    ) / samples.length);

    // 255 is max volume value; 2.55 is 1% of max
    const isConstantAudio = stdDev <= 2.55;
    if (isConstantAudio && sampleAverage <= 2.55) {
      if (!this.activeWarnings.has(WarningName.LowAudioLevel)) {
        this.activeWarnings.add(WarningName.LowAudioLevel);
        this.emit(InputTest.Events.Warning, WarningName.LowAudioLevel);
      }
    } else if (this.activeWarnings.has(WarningName.LowAudioLevel)) {
      this.activeWarnings.delete(WarningName.LowAudioLevel);
      this.emit(InputTest.Events.WarningCleared, WarningName.LowAudioLevel);
    }
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
          volumeEventIntervalMs: validateTime,
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

      if (!this._options.enumerateDevices) {
        throw EnumerateDevicesUnsupportedError;
      }
      this._defaultDevices = getDefaultDevices(
        await this._options.enumerateDevices(),
      );

      if (this._options.recordAudio) {
        if (!this._options.mediaRecorderFactory) {
          throw MediaRecorderUnsupportedError;
        }
        if (!this._options.createObjectURL) {
          throw createObjectURLUnsupportedError;
        }
        if (!this._options.blobFactory) {
          throw BlobUnsupportedError;
        }
        this._mediaRecorder =
          new this._options.mediaRecorderFactory(this._mediaStream);
        const recordData = ({ data }: BlobEvent) => {
          this._audioBlobs.push(data);
        };
        this._mediaRecorder.addEventListener('dataavailable', recordData);
        this._mediaRecorder.addEventListener('stop', () => {
          this._mediaRecorder?.removeEventListener('dataavailable', recordData);
        });
        this._mediaRecorder.start(this._options.volumeEventIntervalMs);
      }

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
        if (typeof this._endTime === 'number') {
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
            this._options.volumeEventIntervalMs,
          );
        }
      };

      this._volumeTimeout = setTimeout(
        volumeEvent,
        this._options.volumeEventIntervalMs,
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
    Warning = 'warning',
    WarningCleared = 'warning-cleared',
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
     * The `blob` object URL containing the audio recorded by the test.
     */
    recordingUrl?: string;

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
     * Used to mock the call to `Blob`.
     * @private
     */
    blobFactory?: typeof window.Blob;

    /**
     * Used to mock the call to `URL.createObjectPolyfill`.
     * @private
     */
    createObjectURL?: typeof window.URL.createObjectURL;

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
    enumerateDevices?: typeof window.navigator.mediaDevices.enumerateDevices;

    /**
     * Used to mock calls to `getUserMedia`.
     * @private
     */
    getUserMedia?: typeof window.navigator.mediaDevices.getUserMedia;

    /**
     * Used to mock `MediaRecorder`.
     * @private
     */
    mediaRecorderFactory?: typeof window.MediaRecorder;

    /**
     * Whether or not to record user audio. If `true`, an "Object URL" is
     * emitted within the report that links to a `blob` that contains the
     * audio captured during the test.
     */
    recordAudio?: boolean;

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
  export type InternalOptions = SubsetRequired<Options, 'duration' | 'volumeEventIntervalMs'>;
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
export function testInputDevice(
  options?: InputTest.Options,
): InputTest {
  return new InputTest(options);
}
