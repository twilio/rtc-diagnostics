import { EventEmitter } from 'events';
import { INCOMING_SOUND_URL } from './constants';
import {
  AlreadyStoppedError,
  DiagnosticError,
} from './errors';

/**
 * Events that the OutputTest will emit as it runs.
 */
export enum OutputTestEvents {
  End = 'end',
  Error = 'error',
  Volume = 'volume',
}

/**
 * Possible options for the `OutputTest`. Both the helper function and the
 * constructor accepts a `Partial` of this.
 */
export interface OutputTestOptions {
  audioContext?: AudioContext;
  duration: number; // Duration to run the test for
  pollIntervalMs: number;
  testURI: string;
}

/**
 * The test summary that is emitted when the OutputTest ends with event
 * `OutputTestEvents.End`.
 */
export interface OutputTestReport {
  deviceId: string | undefined;
  didPass?: boolean;
  endTime: number;
  errors: DiagnosticError[];
  startTime: number;
  testName: typeof OutputTest.testName;
  testURI: string;
  values: number[];
}

/**
 * Supervises an output device test by playing a sound clip that is either the
 * ringing tone for the Client SDK, or defined by the member `testURI` in the
 * `options` parameter.
 *
 * If the data at `testURI` is unable to be loaded, meaning the error event is
 * fired on the audio element, then the test ends immediately with an error in
 * the report.
 *
 * If the test times out (as defined by the `duration` in the `options`
 * paramater), then the test is considered "Not Passing" and ends.
 */
export class OutputTest extends EventEmitter {
  static defaultOptions: OutputTestOptions = {
    duration: Infinity,
    pollIntervalMs: 100,
    testURI: INCOMING_SOUND_URL,
  };
  static testName = 'output-volume' as const;

  options: OutputTestOptions;

  private _audioContext: AudioContext;
  private _audioElement: HTMLAudioElement;
  private _deviceId: string | undefined;
  private _endTime: number | null = null;
  private readonly _errors: DiagnosticError[] = [];
  private _playPromise: Promise<void> | null = null;
  private _startTime: number;
  private readonly _values: number[] = [];
  private _volumeTimeout: NodeJS.Timeout | null = null;

  /**
   * Sets up several things for the `OutputTest` to run later in the
   * `_startTest` function.
   * An `AudioContext` is created if none is passed in the `options` parameter
   * and the `_startTime` is immediately set.
   * @param deviceId
   * @param options
   */
  constructor(
    deviceId?: string,
    options?: Partial<OutputTestOptions>,
  ) {
    super();

    this.options = { ...OutputTest.defaultOptions, ...(options || {}) };

    this._audioContext = this.options.audioContext || new AudioContext();
    this._deviceId = deviceId;
    this._startTime = Date.now();

    this._audioElement = new Audio(this.options.testURI);
    this._audioElement.setAttribute('crossorigin', 'anonymous');
    this._audioElement.loop = true;

    this._startTest();
  }

  /**
   * Stops the test. The call can be given a pass parameter for cases where the
   * user is able to hear and not.
   * @param pass
   */
  async stop(pass?: boolean) {
    if (this._endTime) {
      throw AlreadyStoppedError;
    }

    // Clean up the test.
    if (this._playPromise) {
      try {
        // we need to try to wait for the call to play to finish before we can
        // pause the audio
        await this._playPromise;
        this._audioElement.pause();
      } catch {
        // this means play errored out so we do nothing
      }
    }
    if (!this.options.audioContext) {
      this._audioContext.close();
    }
    if (this._volumeTimeout) {
      clearTimeout(this._volumeTimeout);
    }

    this._endTime = Date.now();
    const report: OutputTestReport = {
      deviceId: this._deviceId,
      didPass: pass,
      endTime: this._endTime,
      errors: this._errors,
      startTime: this._startTime,
      testName: OutputTest.testName,
      testURI: this.options.testURI,
      values: this._values,
    };
    this.emit(OutputTestEvents.End, report);

    return report;
  }

  private _onError(error: DiagnosticError) {
    this._errors.push(error);
    this.emit(OutputTestEvents.Error, error);
  }

  /**
   * Volume event handler, adds the value to the list `_values` and emits it
   * under the event `volume`.
   * @param volume
   */
  private _onVolume(volume: number) {
    this._values.push(volume);
    this.emit(OutputTestEvents.Volume, volume);
  }

  /**
   * Entry point of the test, called after setup in the constructor.
   * Emits the volume levels of the audio.
   * @event `OutputTestEvents.Volume`
   */
  private async _startTest() {
    try {
      const source: MediaElementAudioSourceNode =
        this._audioContext.createMediaElementSource(this._audioElement);
      source.connect(this._audioContext.destination);

      const analyser: AnalyserNode = this._audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.4;
      analyser.fftSize = 64;
      source.connect(analyser);

      const frequencyDataBytes: Uint8Array = new Uint8Array(analyser.frequencyBinCount);
      const volumeEvent = () => {
        if (this._endTime) {
          return;
        }

        analyser.getByteFrequencyData(frequencyDataBytes);
        const volume: number =
          frequencyDataBytes.reduce((sum, val) => sum + val, 0) /
          frequencyDataBytes.length;
        this._onVolume(volume);

        if (Date.now() - this._startTime > this.options.duration) {
          this._onError(new DiagnosticError(
            undefined,
            'Test timed out.',
          ));
          // This means the test timed out, so don't pass the test.
          this.stop(false);
        } else {
          this._volumeTimeout = setTimeout(
            volumeEvent,
            this.options.pollIntervalMs,
          );
        }
      };

      this._playPromise = this._audioElement.play();
      await this._playPromise;
      this._volumeTimeout = setTimeout(
        volumeEvent,
        this.options.pollIntervalMs,
      );
    } catch (error) {
      this._onError(new DiagnosticError(error));
      this.stop();
    }
  }
}

/**
 * Helper function that creates an OutputTest object.
 * @param deviceId
 * @param options
 */
export const testOutputDevice = (
  deviceId?: string,
  options?: Partial<OutputTestOptions>,
) => (
  new OutputTest(deviceId, options)
);
