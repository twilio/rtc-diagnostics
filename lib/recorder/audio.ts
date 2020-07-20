import { DiagnosticError } from '../errors';
import { MediaStreamRecorder } from '../types';
import { Encoder } from './encoder';

/**
 * The [[AudioRecorder]] allows cross browser recording of audio from an input MediaStream.
 * It uses the native MediaStream Recording APIs if available, else, it process raw audio data
 * and converts it to a blob.
 * @internalapi
 */
export class AudioRecorder {
  /**
   * The raw audio data captured during the test
   */
  private _audioData: MediaStreamRecorder.AudioData[] = [];

  /**
   * The MediaRecorder instance to be used for capturing audio
   */
  private _mediaRecorder: MediaStreamRecorder.MediaRecorder;

  /**
   * Promise handle after calling .stop()
   */
  private _stopPromise: Promise<DiagnosticError> | null = null;

  /**
   * The source input stream
   */
  private _stream: MediaStream;

  /**
   * The resuling object url that can be used for audio playback
   */
  private _url: string = '';

  /**
   * Construct an [[AudioRecorder]] instance and will start the recording immediately.
   * @constructor
   * @param options
   */
  constructor(options: AudioRecorder.ExtendedOptions) {
    const factory = options.MediaRecorderFactory ?? (window as any).MediaRecorder ?? Encoder;
    this._stream = options.stream.clone();
    this._mediaRecorder = new factory(this._stream, options.audioContext);
    this._mediaRecorder.ondataavailable = (e: MediaStreamRecorder.DataEvent) => this._audioData.push(e.data);
    this._mediaRecorder.start();
  }

  /**
   * Stops the recording process.
   * If successful, the `.url` property will be populated.
   */
  stop(): Promise<DiagnosticError | null> {
    if (this._stopPromise) {
      return Promise.reject(new DiagnosticError(undefined, 'MediaRecorder has already stopped'));
    }
    this._stopPromise = new Promise((resolve, reject) => {
      this._mediaRecorder.onstop = () => {
        try {
          this._stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          this._generateObjectUrl();
        } catch (ex) {
          reject(new DiagnosticError(ex, 'Unable to generate Object URL'));
          return;
        }
        resolve();
      };
      this._mediaRecorder.stop();
    });
    return this._stopPromise;
  }

  /**
   * Generates the object url that can be used for audio playback from raw audio data
   */
  private _generateObjectUrl(): void {
    // Use wav for faster and simple encoding
    const blob = new Blob(this._audioData, { type: 'audio/wav' });
    this._url = URL.createObjectURL(blob);
    this._audioData = [];
  }

  /**
   * The resuling object url that can be used for audio playback
   */
  get url(): string {
    return this._url;
  }
}

/**
 * @internalapi
 */
export namespace AudioRecorder {
  /**
   * Options that may be passed to [[AudioRecorder]] constructor for internal testing.
   * @internalapi
   */
  export interface ExtendedOptions extends Options {
    /**
     * The MediaRecorder class to use for testing
     */
    MediaRecorderFactory?: any;
  }

  /**
   * Options passed to [[AudioRecorder]] constructor.
   * @internalapi
   */
  export interface Options {
    /**
     * The AudioContext instance to use
     */
    audioContext: AudioContext;

    /**
     * The source input stream
     */
    stream: MediaStream;
  }
}
