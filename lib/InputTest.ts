import { EventEmitter } from 'events';

import { DiagnosticError } from './error';

/**
 * Possible events that an `InputTest` might emit.
 */
export enum InputTestEvents {
  End = 'end',
  Volume = 'volume',
  Error = 'error',
}

/**
 * Report that will be emitted by the `InputTest` once the test has finished.
 */
export interface InputTestReport {
  startTime: number;
  endTime: number;
  testName: 'input-volume',
  deviceId: string | undefined, // TODO should this be undefined?
  // when we pass no device id to getusermedia, we get the device id of the
  // default device, so there is always a device id
  didPass: boolean,
  errors: DiagnosticError[],
  values: number[],
}

/**
 * Options that can be passed to the `InputTest`.
 */
export interface InputTestOptions {
  fftSize: number,
  pollingRate: number,
  smoothingTimeConstant: number,
  ttl: number, // Duration of time to run the test in ms
  mediaStream?: MediaStream,
}

/**
 * Default options for the `InputTest`.
 */
const defaultInputTestOptions: InputTestOptions = {
  pollingRate: 100,
  smoothingTimeConstant: 0.8,
  fftSize: 1024,
  ttl: 5000,
};

/**
 * Supervises an input device test utilizing a `MediaStream` passed to it, or an
 * input `MediaStream` obtained from `getUserMedia` if there is no `MediaStream`
 * passed via `options`.
 *
 * If the call to `getUserMedia` fails (i.e. when a user denies permission to
 * acquire media), then the constructor will throw the `DOMError` from
 * `getUserMedia`.
 *
 * The entry point of the test is the [[start]] function. The events defined in
 * the enum [[InputTestEvents]] are emitted as the test runs.
 */
class InputTest extends EventEmitter {
  private userMediaPromise: Promise<MediaStream>;
  private options: InputTestOptions;

  private deviceId?: string;
  private startTime: number | null = null;
  private endTime: number | null = null;
  private values: number[] = [];
  private errors: DiagnosticError[] = [];

  constructor(
    deviceId?: string,
    options?: Partial<InputTestOptions>
  ) {
    super();
    this.deviceId = deviceId;
    this.options = { ...defaultInputTestOptions, ...(options || {}) };
    this.userMediaPromise = this.options.mediaStream
      ? Promise.resolve(this.options.mediaStream)
      : navigator.mediaDevices.getUserMedia({ audio: { deviceId } })
          .catch(reason => {
            const error = new DiagnosticError(reason);
            this.onError(error);

            // Because this is a fatal error, we can throw the error here to
            // prevent the test from being started
            throw error;
          });
  }

  /**
   * Called every `InputTest.options.pollingRate` ms, emits the volume passed
   * to it as a `InputTestEvents.Volume` event.
   * @param value the volume
   */
  onVolume(value: number) {
    this.values = [...this.values, value];
    this.emit(InputTestEvents.Volume, value);
  }

  /**
   * Helper function that should be called when an error occurs, recoverable
   * or not.
   * @param error
   */
  onError(error: DiagnosticError) {
    this.errors = [...this.errors, error];
    this.emit(InputTestEvents.Error, error);
  }

  determinePass(volumeValues: number[]) {
    // TODO Come up with a better algorithm for deciding if the volume values
    // resulting in a success

    // Loops over every sample, checks to see if it was completely silent by
    // checking if the average of the amplitudes is 0, and returns whether or
    // not more than 50% of the samples were silent.
    return (volumeValues.filter(v => v > 0).length / volumeValues.length)
      > 0.5;
  }

  /**
   * Entry point into the input device test. Uses the `MediaStream` that the
   * object was set up with, and performs a fourier transform on the audio data
   * using an `AnalyserNode`. The output of the fourier transform are the
   * relative amplitudes of the frequencies of the audio data. The average of
   * this data can then be used as an estimate as the average volume of the
   * entire volume source.
   *
   * @event InputTestEvents.Volume
   */
  start(): Promise<InputTestReport> {
    if (this.startTime !== null) {
      // Do nothing if this test has already been started once.
      return Promise.reject(new DiagnosticError(
        undefined,
        'This test has already been started.'
      ));
    }

    /**
     * This Promise will resolve with a report object when the test has
     * successfully run for `this.options.ttl` amount of milliseconds, or will
     * reject if an internal error occurs.
     * This report is also emitted at the end of the test with the event
     * `InputTestEvent.End`.
     *
     * This rejection should never occur, as `this.startTime` is set before
     * it is ever used as a number in the `volumeEvent` handler, but the logic
     * is still there as a failsafe.
     */
    return new Promise(async (resolve, reject) => {
      const userMedia = await this.userMediaPromise;
      const audioContext = new AudioContext();

      const analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
      analyser.fftSize = this.options.fftSize;

      const microphone = audioContext.createMediaStreamSource(userMedia);
      microphone.connect(analyser);

      const cleanup = () => {
        analyser.disconnect();
        microphone.disconnect();
      }

      // This function runs every `this.options.reportRate` ms and emits the
      // current volume of the `MediaStream`.
      const volumeEvent = () => {
        const frequencyDataBytes = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyDataBytes);
        const volume = frequencyDataBytes.reduce((sum, val) => sum + val, 0) /
          frequencyDataBytes.length;
        this.onVolume(volume);

        if (this.startTime === null) {
          reject(new DiagnosticError(
            undefined,
            'SDK in unknown state, `this.startTime === null`.'
          ));
          cleanup();
          return;
        }

        if (Date.now() - this.startTime > this.options.ttl) {
          cleanup();
          this.endTime = Date.now();
          const report: InputTestReport = {
            startTime: this.startTime,
            endTime: this.endTime,
            testName: 'input-volume',
            deviceId: this.deviceId,
            errors: this.errors,
            values: this.values,
            didPass: this.determinePass(this.values),
          };
          this.emit(InputTestEvents.End, report);
          resolve(report);
        } else {
          setTimeout(volumeEvent, this.options.pollingRate);
        }
      }

      this.startTime = Date.now();
      setTimeout(volumeEvent);
    });
  }
}

/**
 * Helper function that instantiates a `InputTest` for the user.
 * @param deviceId
 * @param options
 */
export const testInputDevice = (
  deviceId?: string,
  options?: Partial<InputTestOptions>
) => (
  new InputTest(deviceId, options)
);
