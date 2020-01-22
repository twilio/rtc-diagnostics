import { EventEmitter } from 'events';
import {
  AlreadyStoppedError,
  DiagnosticError,
} from './errors';
import {
  polyfillAudioContext,
  polyfillGetUserMedia,
} from './polyfills';

export declare interface InputTest {
  emit(event: InputTest.Events.End, didPass: boolean, report: InputTest.Report): boolean;
  emit(event: InputTest.Events.Error, error: DiagnosticError): boolean;
  emit(event: InputTest.Events.Volume, value: number): boolean;

  on(event: InputTest.Events.End, listener: (didPass: boolean, report: InputTest.Report) => any): this;
  on(event: InputTest.Events.Error, listener: (error: DiagnosticError) => any): this;
  on(event: InputTest.Events.Volume, listener: (value: number) => any): this;
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
   * Default options for the `InputTest`.
   */
  static defaultOptions: InputTest.Options = {
    debug: false,
    duration: Infinity,
    pollIntervalMs: 100,
  };
  static testName = 'input-volume' as const;

  private _audioContext: AudioContext | null = null;
  private _cleanupAudio: (() => void) | null = null;
  private _endTime: number | null = null;
  private readonly _errors: DiagnosticError[] = [];
  private _maxValue: number = 0;
  private _mediaStream: MediaStream | null = null;
  private _options: InputTest.Options;
  private _startTime: number;
  private readonly _values: number[] = [];
  private _volumeTimeout: NodeJS.Timeout | null = null;

  /**
   * Initializes the `startTime` and `options`.
   * @param deviceIdOrTrack
   * @param options
   */
  constructor(options: Partial<InputTest.Options>) {
    super();

    this._options = { ...InputTest.defaultOptions, ...options };

    this._startTime = Date.now();

    // We need to use a `setTimeout` here to prevent a race condition.
    // This allows event listeners to bind before the test starts.
    setTimeout(() => this._startTest());
  }

  /**
   * Stop the currently running `InputTest`.
   * @param pass whether or not the test should pass. If set to false, will
   * override the result from `determinePass`.
   */
  stop(pass: boolean = true) {
    if (this._endTime) {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    // Perform cleanup
    this._cleanup();

    this._endTime = Date.now();
    const didPass = pass && this._determinePass();
    const report = {
      deviceId: this._options.deviceId,
      didPass,
      endTime: this._endTime,
      errors: this._errors,
      startTime: this._startTime,
      testName: InputTest.testName,
      values: this._values,
    };
    this.emit(InputTest.Events.End, didPass, report);

    return report;
  }

  get maxVolume(): number {
    return this._maxValue;
  }

  /**
   * Clean up any instanciated objects (i.e. `AudioContext`, `MediaStreams`,
   * etc.).
   * Called by `.stop`.
   */
  private _cleanup() {
    if (this._volumeTimeout) {
      clearTimeout(this._volumeTimeout);
    }
    if (this._cleanupAudio) {
      this._cleanupAudio();
    }
    if (this._mediaStream) {
      this._mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this._audioContext) {
      this._audioContext.close();
    }
  }

  private _determinePass(): boolean {
    // TODO Come up with a better algorithm for deciding if the volume values
    // resulting in a success

    // Loops over every sample, checks to see if it was completely silent by
    // checking if the average of the amplitudes is 0, and returns whether or
    // not more than 50% of the samples were silent.
    return this._values.length > 3 &&
      (this._values.filter(v => v > 0).length / this._values.length) > 0.5;
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
  private _onWarning(error: DiagnosticError) {
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
  private async _startTest() {
    try {
      this._mediaStream = await (
        this._options.getUserMedia || polyfillGetUserMedia()
      )({
        audio: { deviceId: this._options.deviceId },
      });

      this._audioContext = new (
        this._options.audioContextFactory || polyfillAudioContext()
      )();

      const analyser: AnalyserNode = this._audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.4;
      analyser.fftSize = 64;

      const microphone: MediaStreamAudioSourceNode =
        this._audioContext.createMediaStreamSource(this._mediaStream);
      microphone.connect(analyser);

      this._cleanupAudio = () => {
        analyser.disconnect();
        microphone.disconnect();
      };

      const frequencyDataBytes: Uint8Array = new Uint8Array(analyser.frequencyBinCount);

      // This function runs every `this._options.reportRate` ms and emits the
      // current volume of the `MediaStream`.
      const volumeEvent = () => {
        if (this._endTime) {
          return;
        }

        analyser.getByteFrequencyData(frequencyDataBytes);
        const volume: number =
          frequencyDataBytes.reduce((sum, val) => sum + val, 0) /
          frequencyDataBytes.length;
        this._onVolume(volume);

        if (Date.now() - this._startTime > this._options.duration) {
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
      }
      this.stop(false);
    }
  }
}

export namespace InputTest {
  /**
   * Possible events that an `InputTest` might emit.
   * See [[InputTest.emit]] and [[InputTest.on]].
   * @event
   */
  export enum Events {
    /**
     * Emitted by the test upon completion with a parameter of type [[Report]].
     * @event
     */
    End = 'end',
    /**
     * Emitted by the test when encountering an error with a parameter of type
     * [[DiagnosticError]].
     * @event
     */
    Error = 'error',
    /**
     * Emitted by the test every [[Options.pollIntervalMs]] amount of
     * milliseconds with a parameter of type `number` that represents the
     * current volume of the audio stream.
     * @event
     */
    Volume = 'volume',
  }

  /**
   * Report that will be emitted by the [[InputTest]] once the test has
   * finished.
   */
  export interface Report {
    /**
     * The device ID that is passed to the test constructor.
     */
    deviceId: MediaTrackConstraintSet['deviceId'];
    /**
     * Whether or not the test passed as determined by
     * [[InputTest._determinePass]]
     */
    didPass: boolean;
    /**
     * Timestamp of test completion.
     */
    endTime: number;
    /**
     * Any errors that occurred during the run-time of the test.
     */
    errors: DiagnosticError[];
    /**
     * Timestamp of test start.
     */
    startTime: number;
    /**
     * The name of the test, should be `input-volume`.
     */
    testName: typeof InputTest.testName;
    /**
     * The volume values emitted by the test during its run-time.
     */
    values: number[];
  }

  /**
   * Options that can be passed to the `InputTest`.
   */
  export interface Options {
    /**
     * AudioContext mock to be used during the test.
     * @private
     */
    audioContextFactory?: typeof window.AudioContext;
    /**
     * Whether or not to log debug statements to the console.
     */
    debug: boolean;
    /**
     * The device ID to try to get a MediaStream from using `getUserMedia`.
     */
    deviceId?: MediaTrackConstraintSet['deviceId'];
    /**
     * Duration of time to run the test in ms
     */
    duration: number;
    /**
     * Used to mock calls to `getUserMedia`.
     * @private
     */
    getUserMedia?: typeof window.navigator.mediaDevices.getUserMedia;
    /**
     * The polling rate to emit volume events.
     */
    pollIntervalMs: number;
  }
}

/**
 * Helper function that instantiates a `InputTest` for the user.
 * @param deviceId
 * @param options
 */
export function testInputDevice(): InputTest;

export function testInputDevice(
  deviceId: MediaTrackConstraintSet['deviceId'],
  options?: Partial<InputTest.Options>,
): InputTest;

export function testInputDevice(
  deviceId?: MediaTrackConstraintSet['deviceId'],
  options: Partial<InputTest.Options> = {},
) {
  return new InputTest({ ...options, deviceId });
}
