import { ENCODER_PARAMS } from '../../constants';
import { waveEncoder } from './worker';

/**
 * The [[Encoder]] reads audio data via an AudioContext and encodes it to a wav data format.
 * The wav data can be then converted into a blob which can be used for playback.
 * @internalapi
 */
export class Encoder {
  /**
   * The AudioContext instance to use for processing audio data
   */
  private _audioContext: AudioContext;

  /**
   * A Web Worker instance which handles encoding of raw data into wav
   */
  private _encoder: Worker;

  /**
   * The input MediaStream to record
   */
  private _stream: MediaStream;

  /**
   * Construct an [[Encoder]] instance and and prepares the Web Worker
   * @constructor
   * @param stream - The input MediaStream to record
   * @param audioContext - The AudioContext instance to use for processing audio data
   */
  constructor(stream: MediaStream, audioContext: AudioContext, audioEncoder: any = waveEncoder) {
    this._encoder = createWorker(audioEncoder);
    this._audioContext = audioContext;
    this._stream = stream;
  }

  /**
   * Called when raw data is available
   * @override
   */
  ondataavailable: Function = () => undefined;

  /**
   * Called when encoding stops
   * @override
   */
  onstop: Function = () => undefined;

  /**
   * Starts the encoding process
   */
  start(): void {
    const src = this._audioContext.createMediaStreamSource(this._stream);
    const processor = this._audioContext.createScriptProcessor(...ENCODER_PARAMS);

    processor.onaudioprocess = (e) => this._encoder.postMessage(['encode', e.inputBuffer.getChannelData(0)]);

    src.connect(processor);
    processor.connect(this._audioContext.destination);
  }

  /**
   * Stops the encoding process
   */
  stop(): void {
    this._encoder.addEventListener('message', e => {
      this.ondataavailable(e);
      this.onstop();
    });
    this._encoder.postMessage(['dump', this._audioContext.sampleRate]);
  }
}

/**
 * Creates a worker from a js function
 * @internalapi
 */
function createWorker(fn: Function) {
  return new Worker(URL.createObjectURL(new Blob([fn
    .toString()
    .replace(/^(\(\)\s*=>|function\s*\(\))\s*{/, '')
    .replace(/}$/, '')])));
}
