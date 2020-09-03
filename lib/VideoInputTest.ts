import { EventEmitter } from 'events';
import {
  AlreadyStoppedError,
  DiagnosticError,
  InvalidOptionsError,
} from './errors';
import {
  getUserMedia,
  GetUserMediaUnsupportedError,
} from './polyfills';
import {
  SubsetRequired,
  TimeMeasurement,
  VideoResolution,
} from './types';
import {
  InvalidityRecord,
  validateDeviceId,
  validateOptions,
  validateTime,
} from './utils/optionValidation';

export declare interface VideoInputTest {
  /**
   * This event is emitted with a test report when the test ends.
   * @param event [[VideoInputTest.Events.End]]
   * @param report Summary of the test.
   * @private
   */
  emit(
    event: VideoInputTest.Events.End,
    report: VideoInputTest.Report,
  ): boolean;
  /**
   * This event is emitted with a [[DiagnosticError]] when the test encounters
   * an error, fatal or not.
   * @param event [[VideoInputTest.Events.Error]]
   * @param error The [[DiagnosticError]] that was encountered.
   * @private
   */
  emit(
    event: VideoInputTest.Events.Error,
    error: DiagnosticError,
  ): boolean;

  /**
   * Raised upon completion of the test.
   * @param event [[VideoInputTest.Events.End]]
   * @param listener A callback that expects the following parameters:
   *  An [[VideoInputTest.Report]] that summarizes the test.
   * @returns This [[VideoInputTest]] instance.
   * @event
   */
  on(
    event: VideoInputTest.Events.End,
    listener: (report: VideoInputTest.Report) => any,
  ): this;
  /**
   * Raised by the test when encountering an error with a parameter of type
   * [[DiagnosticError]].
   * @param event [[VideoInputTest.Events.Error]]
   * @param listener A callback that expects the following parameters:
   *  A [[DiagnosticError]] that the test encountered.
   * @returns This [[VideoInputTest]] instance.
   * @event
   */
  on(
    event: VideoInputTest.Events.Error,
    listener: (error: DiagnosticError) => any,
  ): this;
}

/**
 * [[VideoInputTest]] class that parses options and starts a video input device
 * test.
 *
 * Please see [[testVideoInputDevice]] for details and recommended practices.
 */
export class VideoInputTest extends EventEmitter {
  /**
   * The name of the test.
   */
  static readonly testName: string = 'video-input-test';
  /**
   * Default options for the test.
   */
  private static defaultOptions: VideoInputTest.InternalOptions = {
    debug: false,
    duration: Infinity,
    getUserMedia,
  };

  /**
   * Timestamp of when the test was ended.
   */
  private _endTime: number | null = null;
  /**
   * An array of any errors that occur during the run time of the test.
   */
  private readonly _errors: DiagnosticError[] = [];
  /**
   * Options to be used throughout the runtime of the test.
   */
  private _options: VideoInputTest.InternalOptions;
  /**
   * The promise returned by the `HTMLMediaElement` after playing the stream
   * captured by `getUserMedia`.
   */
  private _playPromise: Promise<void> | null = null;
  /**
   * Timestamp of when the test was started.
   */
  private _startTime: number | undefined;
  /**
   * Timer ID of the test duration timeout.
   */
  private _timeoutId: NodeJS.Timeout | null = null;
  /**
   * The `MediaStream` resulting from calling `getUserMedia`.
   */
  private _userMediaStream: MediaStream | null = null;

  /**
   * Constructor for a [[VideoInputTest]] object.
   * @param options Options to be used during the runtime of the test.
   */
  constructor(options?: VideoInputTest.Options) {
    super();

    this._options = { ...VideoInputTest.defaultOptions, ...options };

    /**
     * Use `setTimeout` to allow event listeners to properly bind before
     * starting the test.
     */
    setTimeout(() => this._startTest());
  }

  /**
   * Stops the test. Emits a report upon the end of the test.
   */
  stop(): void {
    if (typeof this._endTime === 'number') {
      this._onWarning(new AlreadyStoppedError());
      return;
    }

    this._endTime = Date.now();

    const {
      width: streamWidth,
      height: streamHeight,
      deviceId,
    } = this._userMediaStream?.getVideoTracks()[0].getSettings() || {};

    const report: VideoInputTest.Report = {
      deviceId,
      errors: this._errors,
      resolution: { width: streamWidth || 0, height: streamHeight || 0 },
      testName: VideoInputTest.testName,
    };

    if (this._startTime) {
      report.testTiming = {
        duration: this._endTime - this._startTime,
        end: this._endTime,
        start: this._startTime,
      };
    }

    this.emit(VideoInputTest.Events.End, report);

    this._cleanup();
  }

  /**
   * Clean up the test.
   */
  private _cleanup(): void {
    if (this._userMediaStream) {
      this._userMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      this._userMediaStream = null;
      if (this._options.element) {
        const element: HTMLMediaElement = this._options.element;
        const pausePromise: Promise<void> = this._playPromise
          ? this._playPromise.then(() => {
              element.pause();
            })
          : Promise.resolve();
        pausePromise.finally(() => {
          element.srcObject = null;
          element.src = '';
          element.load();
        });
      }
    }
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  /**
   * Helper function that should be called when an error occurs, recoverable
   * or not.
   * @param error
   */
  private _onError(error: DiagnosticError): void {
    this._errors.push(error);
    this.emit(VideoInputTest.Events.Error, error);
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
   * Entry point of the test.
   */
  private async _startTest(): Promise<void> {
    try {
      const invalidReasons: InvalidityRecord<VideoInputTest.Options> | undefined =
        await validateOptions<VideoInputTest.Options>(this._options, {
          deviceId: validateDeviceId,
          duration: validateTime,
        });
      if (invalidReasons) {
        throw new InvalidOptionsError(invalidReasons);
      }

      if (!this._options.getUserMedia) {
        throw GetUserMediaUnsupportedError;
      }

      this._userMediaStream = await this._options.getUserMedia({ video: {
        deviceId: this._options.deviceId,
        ...this._options.resolution,
      } });

      this._startTime = Date.now();

      if (this._options.element) {
        this._options.element.srcObject = this._userMediaStream;
        this._playPromise = this._options.element.play();
      }

      if (this._options.duration && this._options.duration !== Infinity) {
        this._timeoutId = setTimeout(() => this.stop(), this._options.duration);
      }
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

export namespace VideoInputTest {
  /**
   * Possible events that a [[VideoInputTest]] might emit. See [[VideoInputTest.on]].
   */
  export enum Events {
    End = 'end',
    Error = 'error',
  }

  export interface Report {
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

  export interface Options {
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
  export type InternalOptions = SubsetRequired<Options, 'debug' | 'duration'>;
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
export function testVideoInputDevice(
  options?: VideoInputTest.Options,
): VideoInputTest {
  return new VideoInputTest(options);
}
