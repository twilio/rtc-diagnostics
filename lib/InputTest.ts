import { EventEmitter } from 'events';
import {
  AlreadyStoppedError,
  DiagnosticError,
} from './errors';

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
    duration: 5000,
    pollIntervalMs: 100,
  };
  static testName = 'input-volume' as const;

  private _audioContext: AudioContext;
  private _cleanupAudio: (() => void) | null = null;
  private _endTime: number | null = null;
  private readonly _errors: DiagnosticError[] = [];
  private _maxValue: number = 0;
  private _mediaStreamPromise: Promise<MediaStream>;
  private _options: InputTest.Options;
  private _startTime: number;
  private readonly _values: number[] = [];
  private _volumeTimeout: NodeJS.Timeout | null = null;

  /**
   * Creates an `AudioContext` for use in the test if none is passed via
   * the `options` parameter.
   * @param deviceIdOrTrack
   * @param options
   */
  constructor(options: Partial<InputTest.Options>) {
    super();

    this._options = { ...InputTest.defaultOptions, ...options };

    this._audioContext = this._options.audioContext || new AudioContext();
    this._mediaStreamPromise = this._options.mediaStream
      ? Promise.resolve(this._options.mediaStream)
      : (this._options.getUserMedia || navigator.mediaDevices.getUserMedia)({
          audio: { deviceId: this._options.deviceId },
        });

    this._startTime = Date.now();
    this._startTest();
  }

  /**
   * Stop the currently running `InputTest`.
   */
  async stop() {
    if (this._endTime) {
      throw new AlreadyStoppedError();
    }

    // Perform cleanup
    if (this._cleanupAudio !== null) {
      this._cleanupAudio();
    }
    if (!this._options.mediaStream) {
      // this means we made a call to getUserMedia
      // we don't want to stop the tracks we get if they were passed in via
      // parameters
      try {
        const mediaStream = await this._mediaStreamPromise;
        mediaStream.getTracks().forEach(track => track.stop());
      } catch {
        // if the media stream promise failed, we didn't successfully perform
        // getUserMedia, and therefore we don't need to stop any tracks
      }
    }
    if (!this._options.audioContext) {
      // This means we made our own `AudioContext` so we want to close it
      this._audioContext.close();
    }
    if (this._volumeTimeout !== null) {
      clearTimeout(this._volumeTimeout);
    }

    this._endTime = Date.now();
    const didPass = this._determinePass();
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

  private _determinePass(): boolean {
    // TODO Come up with a better algorithm for deciding if the volume values
    // resulting in a success

    // Loops over every sample, checks to see if it was completely silent by
    // checking if the average of the amplitudes is 0, and returns whether or
    // not more than 50% of the samples were silent.
    return this._errors.length === 0 &&
      this._values.length > 3 &&
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
      const mediaStream: MediaStream = await this._mediaStreamPromise;

      const analyser: AnalyserNode = this._audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.4;
      analyser.fftSize = 64;

      const microphone: MediaStreamAudioSourceNode =
        this._audioContext.createMediaStreamSource(mediaStream);
      microphone.connect(analyser);

      this._cleanupAudio = () => {
        analyser.disconnect();
        microphone.disconnect();
      };

      const frequencyDataBytes: Uint8Array = new Uint8Array(analyser.frequencyBinCount);

      // This function runs every `this._options.reportRate` ms and emits the
      // current volume of the `MediaStream`.
      const volumeEvent = () => {
        if (this._endTime !== null) {
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
      if (error instanceof DOMError) {
        // This means that the call to `getUserMedia` failed, so we should
        // just emit a failed `end` event.
        this._onError(new DiagnosticError(
          error,
          'Call to `getUserMedia` failed.',
        ));
      } else if (error instanceof DiagnosticError) {
        // There is some other fatal error.
        this._onError(error);
      } else {
        // There is an unknown fatal error.
        console.error(error); // tslint:disable-line no-console
      }
      this.stop();
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
     * AudioContext to be used during the test. If none is passed, then one will
     * be made upon construction and closed upon completion. If one is passed,
     * it will _not_ be closed on completion.
     */
    audioContext?: AudioContext;
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
    getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    /**
     * MediaStream to use during the test. If none is passed, then a call to
     * `getUserMedia` will be made to try and get the medi
     */
    mediaStream?: MediaStream;
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
