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
  enumerateDevices,
  EnumerateDevicesUnsupportedError,
  getDefaultDevices,
  getUserMedia,
  GetUserMediaUnsupportedError,
} from './polyfills';
import { AudioRecorder } from './recorder/audio';
import { SubsetRequired, TimeMeasurement, VolumeStats } from './types';
import {
  InvalidityRecord,
  validateDeviceId,
  validateOptions,
  validateTime,
} from './utils/optionValidation';

export declare interface AudioInputTest {
  /**
   * This event is emitted with a test report when the test ends.
   * @param event [[AudioInputTest.Events.End]]
   * @param report Summary of the test.
   * @private
   */
  emit(
    event: AudioInputTest.Events.End,
    report: AudioInputTest.Report,
  ): boolean;
  /**
   * This event is emitted with a [[DiagnosticError]] when the test encounters
   * an error, fatal or not.
   * @param event [[AudioInputTest.Events.Error]]
   * @param error The [[DiagnosticError]] that was encountered.
   * @private
   */
  emit(
    event: AudioInputTest.Events.Error,
    error: DiagnosticError,
  ): boolean;
  /**
   * This event is emitted with a volume level every
   * [[AudioInputTest.Options.volumeEventIntervalMs]] after the test starts succesfully.
   * @param event [[AudioInputTest.Events.Volume]]
   * @param value The current volume of the audio source.
   * @private
   */
  emit(
    event: AudioInputTest.Events.Volume,
    value: number,
  ): boolean;
  /**
   * This event is emitted when the test encounters a non-fatal warning during
   * its run-time.
   * @param event [[AudioInputTest.Events.Warning]]
   * @param warning The warning that the test encountered.
   * @private
   */
  emit(
    event: AudioInputTest.Events.Warning,
    warning: WarningName,
  ): boolean;
  /**
   * This event is emitted when the test clears a previously encountered
   * non-fatal warning during its run-time.
   * @param event [[AudioInputTest.Events.WarningCleared]]
   * @param warning The warning that the test encountered that should be cleared.
   * @private
   */
  emit(
    event: AudioInputTest.Events.WarningCleared,
    warning: WarningName,
  ): boolean;

  /**
   * Raised upon completion of the test.
   * @param event [[AudioInputTest.Events.End]]
   * @param listener A callback that expects the following parameters:
   *  An [[AudioInputTest.Report]] that summarizes the test.
   * @returns This [[AudioInputTest]] instance.
   * @event
   */
  on(
    event: AudioInputTest.Events.End,
    listener: (report: AudioInputTest.Report) => any,
  ): this;
  /**
   * Raised by the test when encountering an error with a parameter of type
   * [[DiagnosticError]].
   * @param event [[AudioInputTest.Events.Error]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticError]] that the test encountered.
   * @returns This [[AudioInputTest]] instance.
   * @event
   */
  on(
    event: AudioInputTest.Events.Error,
    listener: (error: DiagnosticError) => any,
  ): this;
  /**
   * Raised by the test every [[Options.volumeEventIntervalMs]] amount of
   * milliseconds with a parameter of type `number` that represents the
   * current volume of the audio stream.
   * @param event [[AudioInputTest.Events.Volume]]
   * @param listener A callback that expects the following parameters:
   *  A `number` that represents the audio source's current volume.
   * @returns This [[AudioInputTest]] instance.
   * @event
   */
  on(
    event: AudioInputTest.Events.Volume,
    listener: (value: number) => any,
  ): this;
  /**
   * Raised by the test when the test encounters a non-fatal warning during
   * its run-time.
   * @param event [[AudioInputTest.Events.Warning]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticWarning]].
   * @returns This [[AudioInputTest]] instance.
   * @event
   */
  on(
    event: AudioInputTest.Events.Warning,
    listener: (warning: WarningName) => any,
  ): this;
  /**
   * Raised by the test when the test clears a previously encountered non-fatal
   * warning during its run-time.
   * @param event [[AudioInputTest.Events.WarningCleared]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticWarning]] name.
   * @returns This [[AudioInputTest]] instance.
   * @event
   */
  on(
    event: AudioInputTest.Events.WarningCleared,
    listener: (warning: WarningName) => any,
  ): this;
}

/**
 * [[AudioInputTest]] class that parses options and starts an audio input device
 * test.
 *
 * Please see [[testAudioInputDevice]] for details and recommended practices.
 */
export class AudioInputTest extends EventEmitter {
  /**
   * Name of the test.
   */
  static testName: TestName.InputAudioDevice = TestName.InputAudioDevice;

  /**
   * Default options for the [[AudioInputTest]].
   */
  private static defaultOptions: AudioInputTest.InternalOptions = {
    audioContextFactory: AudioContext,
    audioRecorderFactory: AudioRecorder,
    debug: false,
    duration: Infinity,
    enableRecording: false,
    enumerateDevices,
    getUserMedia,
    volumeEventIntervalMs: 100,
  };

  /**
   * Active warnings to keep track of.
   */
  readonly activeWarnings: Set<WarningName> = new Set();

  /**
   * An `AudioContext` to use for generating volume levels.
   */
  private _audioContext: AudioContext | null = null;
  /**
   * An AudioRecorder object used to capture audio input during the test
   */
  private _audioRecorder: AudioRecorder | null = null;
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
   * A `MediaStream` that is created from the input device.
   */
  private _mediaStream: MediaStream | null = null;
  /**
   * Options that are passed to and set in the constructor for use during the
   * test.
   */
  private _options: AudioInputTest.InternalOptions;
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
  constructor(options?: AudioInputTest.Options) {
    super();

    this._options = { ...AudioInputTest.defaultOptions, ...options };

    // We need to use a `setTimeout` here to prevent a race condition.
    // This allows event listeners to bind before the test starts.
    setTimeout(() => this._startTest());
  }

  /**
   * Stop the currently running [[AudioInputTest]].
   */
  stop(): void {
    if (typeof this._endTime === 'number') {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    this._endTime = Date.now();
    const report: AudioInputTest.Report = {
      deviceId: this._options.deviceId || (
        this._defaultDevices.audioinput &&
        this._defaultDevices.audioinput.deviceId
      ),
      errors: this._errors,
      testName: AudioInputTest.testName,
      values: this._volumeStats.values,
    };

    if (this._startTime) {
      report.testTiming = {
        duration: this._endTime - this._startTime,
        end: this._endTime,
        start: this._startTime,
      };
    }

    const onEnd = () => {
      this._cleanup();
      this.emit(AudioInputTest.Events.End, report);
    };

    if (this._options.enableRecording && this._audioRecorder) {
      this._audioRecorder.stop().then(() => {
        report.recordingUrl = this._audioRecorder!.url;
      }).catch((ex: DiagnosticError) => {
        this._onError(ex);
      }).finally(onEnd);
    } else {
      onEnd();
    }
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
    this.emit(AudioInputTest.Events.Error, error);
  }

  /**
   * Called every `AudioInputTest._options.volumeEventIntervalMs` amount of
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
    this.emit(AudioInputTest.Events.Volume, value);

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
        this.emit(AudioInputTest.Events.Warning, WarningName.LowAudioLevel);
      }
    } else if (this.activeWarnings.has(WarningName.LowAudioLevel)) {
      this.activeWarnings.delete(WarningName.LowAudioLevel);
      this.emit(AudioInputTest.Events.WarningCleared, WarningName.LowAudioLevel);
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
   * Entry point into the audio input device test. Uses the `MediaStream` that the
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
      const invalidReasons: InvalidityRecord<AudioInputTest.Options> | undefined =
        await validateOptions<AudioInputTest.Options>(this._options, {
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

      if (!this._options.audioContextFactory) {
        throw AudioContextUnsupportedError;
      }

      // We need to initialize AudioContext and MediaRecorder right after calling gUM
      // and before enumerateDevices. Certain browsers and headsets (Safari, AirPods)
      // loses the "user action" after enumerating devices.
      this._audioContext = new this._options.audioContextFactory();
      if (this._options.enableRecording) {
        this._audioRecorder = new this._options.audioRecorderFactory!({
          audioContext: this._audioContext,
          stream: this._mediaStream,
        });
      }

      if (!this._options.enumerateDevices) {
        throw EnumerateDevicesUnsupportedError;
      }
      this._defaultDevices = getDefaultDevices(
        await this._options.enumerateDevices(),
      );

      // Only starts the timer after successfully getting devices
      this._startTime = Date.now();

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
      this.stop();
    }
  }
}

export namespace AudioInputTest {
  /**
   * Possible events that an [[AudioInputTest]] might emit. See [[AudioInputTest.on]].
   */
  export enum Events {
    End = 'end',
    Error = 'error',
    Volume = 'volume',
    Warning = 'warning',
    WarningCleared = 'warning-cleared',
  }

  /**
   * Represents the report generated from an [[AudioInputTest]].
   */
  export interface Report {
    /**
     * The device ID used to get a MediaStream from using [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
     */
    deviceId: MediaTrackConstraintSet['deviceId'];

    /**
     * Any errors that occurred during the test.
     */
    errors: DiagnosticError[];

    /**
     * If [[AudioInputTest.Options.enableRecording]] is set to true,
     * `recordingUrl` will be available in the report which can be used to playback captured audio from the microphone.
     * Your application should revoke this URL if it is no longer needed.
     *
     * Example:
     *
     * ```ts
     * const audioInputTest: AudioInputTest = testAudioInputDevice({ enableRecording: true });
     * audioInputTest.on(AudioInputTest.Events.End, (report: AudioInputTest.Report) => {
     *   const audioEl = new Audio();
     *   audioEl.src = report.recordingUrl;
     *   audioEl.play();
     *
     *   // Revoke the url if no longer needed
     *   URL.revokeObjectURL(report.recordingUrl);
     * });
     * ```
     */
    recordingUrl?: string;

    /**
     * The name of the test.
     */
    testName: typeof AudioInputTest.testName;

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
   * Options passed to [[AudioInputTest]] constructor.
   */
  export interface Options {
    /**
     * AudioContext mock to be used during the test.
     * @private
     */
    audioContextFactory?: typeof window.AudioContext;

    /**
     * AudioRecorder mock to be used during the test.
     * @private
     */
    audioRecorderFactory?: typeof AudioRecorder;

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
     * Whether the test should record the audio input or not.
     * If set to true, [[AudioInputTest.Report.recordingUrl]] will be available for audio playback.
     * Your application should revoke this URL if it is no longer needed.
     *
     * Example:
     *
     * ```ts
     * const audioInputTest: AudioInputTest = testAudioInputDevice({ enableRecording: true });
     * audioInputTest.on(AudioInputTest.Events.End, (report: AudioInputTest.Report) => {
     *   const audioEl = new Audio();
     *   audioEl.src = report.recordingUrl;
     *   audioEl.play();
     *
     *   // Revoke the url if no longer needed
     *   URL.revokeObjectURL(report.recordingUrl);
     * });
     * ```
     * @default false
     */
    enableRecording?: boolean;

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
  export type InternalOptions = SubsetRequired<Options, 'duration' | 'volumeEventIntervalMs'>;
}

/**
 * [[AudioInputTest]] tests audio input capabilities. It serves to help diagnose
 * potential audio device issues that would prevent audio from being recognized
 * in a WebRTC call.
 *
 * ---
 *
 * The [[AudioInputTest]] class is an `EventEmitter` (please see [[AudioInputTest.on]] for
 * events and their details) and helps to diagnose issues by capturing user
 * audio and emitting the volume levels detected in that media.
 * ```ts
 * import { AudioInputTest, testAudioInputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioInputTest.Options = { ... };
 * // `options` may be left `undefined` to use default option values
 * const audioInputTest: AudioInputTest = testAudioInputDevice(options);
 * ```
 * Applications can use the volume events emitted by the test to update their UI
 * to show to the user whether or not their media was captured successfully.
 * ```ts
 * audioInputTest.on(AudioInputTest.Events.Volume, (volume: number) => {
 *   ui.updateVolume(volume); // Update your UI with the volume value here.
 * });
 * ```
 * The test can be normally stopped two ways: allowing the test to time out and
 * stopping the test manually.
 *
 * To end the test manually, the application can ask the end-user to confirm
 * that the volume levels it emits are what the end-user expects. If so, the
 * application can call the [[AudioInputTest.stop]] method with `true`. Otherwise,
 * if the audio values are not expected, the application can call
 * [[AudioInputTest.stop]] with `false`.
 * ```ts
 * // The UI should indicate that if the volume values are what the user
 * // expects, they can click this button to pass and stop the test...
 * const volumeCorrectButton = ...;
 * volumeCorrectButton.addEventListener('click', () => {
 *   audioInputTest.stop(true);
 * });
 *
 * // ...otherwise, if the volume levels are not what they expect, they can
 * // click this.
 * const volumeIncorrectButton = ...;
 * volumeIncorrectButton.addEventListener('click', () => {
 *   audioInputTest.stop(false);
 * });
 * ```
 * Calling [[AudioInputTest.stop]] will immediately end the test.
 *
 * ---
 *
 * The [[AudioInputTest]] object will always emit a [[AudioInputTest.Report]] with the
 * [[AudioInputTest.Events.End]] event, regardless of the occurrence of errors during
 * the runtime of the test.
 *
 * Fatal errors will immediately end the test and emit a report such that the
 * value of [[AudioInputTest.Report.errors]] will contain the fatal error.
 *
 * Non-fatal errors will not end the test, but will be included in the value of
 * [[AudioInputTest.Report.errors]] upon completion of the test.
 *
 * ---
 *
 * Note: In Firefox, `deviceId` will be ignored, and instead the user will get a
 * browser pop-up where they can select the device they want to use. This is
 * unavoidable as it is Firefox's implementation of `getUserMedia()`.
 *
 * In most browsers, such as Chrome and Safari, when `getUserMedia()` is called,
 * a prompt will ask the user for broad microphone-access permissions. Then, the
 * parameters passed to `getUserMedia()` will determine the device that is
 * captured.
 *
 * Firefox differs in that the prompt will ask for a specific input device.
 * Regardless of the parameters passed to `getUserMedia()`, the device
 * selected in that prompt will be captured. If the user opts to have the
 * browser "Remember this selection" within the prompt, the device that was
 * selected will be captured by every future `getUserMedia()` call as well.
 * This selection will persist even through changes in the system OS, i.e. when
 * default devices are changed. In order to change the device, the user has to
 * revoke the webpage's microphone-access permissions for the prompt to show
 * again.
 *
 * Please see this link for more information on microphone access in Firefox:
 * https://support.mozilla.org/en-US/kb/how-manage-your-camera-and-microphone-permissions
 *
 * ---
 *
 * The function [[testAudioInputDevice]] serves as a factory function that accepts
 * [[AudioInputTest.Options]] as its only parameter and will instantiate an
 * [[AudioInputTest]] object with those options.
 * ```ts
 * import { AudioInputTest, testAudioInputDevice } from '@twilio/rtc-diagnostics';
 * const options: AudioInputTest.Options = { ... };
 * const audioInputTest: AudioInputTest = testAudioInputDevice(options);
 * ```
 *
 * @param options Options to pass to the [[AudioInputTest]] constructor.
 */
export function testAudioInputDevice(
  options?: AudioInputTest.Options,
): AudioInputTest {
  return new AudioInputTest(options);
}
