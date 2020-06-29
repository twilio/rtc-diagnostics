import { EventEmitter } from 'events';
import { BlobPolyfill } from '../polyfills/Blob';

const wavBlobType = 'audio/wav' as const;

function setString(dataView: DataView, offset: number, data: string) {
  Array.from(data).forEach((char: string, index: number) => {
    dataView.setUint8(offset + index, char.charCodeAt(0));
  });
}

function createWavHeaderBlob(sampleRate: number, sampleLength: number): Blob {
  const arrayBuffer: ArrayBuffer = new ArrayBuffer(44);
  const dataView: DataView = new DataView(arrayBuffer);

  // Magic word, denotes beginning of data.
  setString(dataView, 0, 'RIFF');
  // Write the size of the stream (in bytes)
  dataView.setUint32(4, 36 + sampleLength * 2, true);
  // Write another magic word.
  setString(dataView, 8, 'WAVEfmt ');
  // Size of format, 16 bytes.
  dataView.setUint32(16, 16, true);
  // Denote raw audio sample format.
  dataView.setUint16(20, 1, true);
  // Denote mono (1) audio channel.
  dataView.setUint16(22, 2, true);
  // Sample rate.
  dataView.setUint32(24, sampleRate, true);
  // Byte rate.
  dataView.setUint32(28, sampleRate * 2, true);
  // Block align.
  dataView.setUint16(32, 2 * 2, true);
  // Bits per sample.
  dataView.setUint16(34, 16, true);
  // Magic word, denotes end of header and beginning of data.
  setString(dataView, 36, 'data');
  // Length of audio sample data.
  dataView.setUint32(40, sampleLength * 2, true);

  return new Blob([dataView], { type: wavBlobType });
}

/**
 * @internalapi
 * This utility serves as a cross-browser replacement for `MediaRecorder`.
 *
 * It uses the now deprecated `createScriptProcessor` for browsers that are not
 * up-to-date and support the `MediaRecorder` API.
 *
 * At the time of implementation, the only widely-used browser to not support
 * this API is Safari. In Safari, `MediaRecorder` is behind a feature-flag. Once
 * Safari officially supports `MediaRecorder`, then this module will be
 * deprecated in favor of the official `MediaRecorder` API.
 */
export function createMediaStreamRecorderFactory(
  audioContext: AudioContext,
  opts?: MediaStreamRecorderFactoryOptions,
) {
  const options = {
    blobFactory: BlobPolyfill,
    bufferFactory: Buffer,
    dataViewFactory: DataView,
    ...opts,
  };

  return class MediaStreamRecorder extends EventEmitter {
    /**
     * Source node created from the `MediaStream`.
     */
    _audioSourceNode: MediaStreamAudioSourceNode;
    /**
     * Dummy destination node to connect the `ScriptProcessorNode` to.
     *
     * We must connect the script processor node to something otherwise it will
     * not process the audio data.
     */
    _dummyDestinationNode: MediaStreamAudioDestinationNode;
    /**
     * Data recorded by the `ScriptProcessor`.
     */
    _sampleDataSets: number[][] = [];
    /**
     * Sample data sets total length.
     */
    _sampleLength: number = 0;
    /**
     * The sample rate of the audio.
     */
    _sampleRate: number | null = null;
    /**
     * Script processor audio context node that allows us to get the raw mic data.
     */
    _scriptProcessorNode: ScriptProcessorNode;

    /**
     * Rename the event handlers to match the browser event system.
     */
    addEventListener = this.on;
    removeEventListener = this.off;

    /**
     * Constructor for the [[MediaStreamRecorder]] class. Accepts an
     * `AudioContext`, which will be used to create a `ScriptProcessor`.
     * @param audioContext
     */
    constructor(mediaStream: MediaStream) {
      super();

      this._audioSourceNode = audioContext.createMediaStreamSource(mediaStream);

      this._scriptProcessorNode = audioContext.createScriptProcessor(16384);
      this._audioSourceNode.connect(this._scriptProcessorNode);

      this._scriptProcessorNode.addEventListener(
        'audioprocess',
        this._audioProcess.bind(this));

      this._dummyDestinationNode = audioContext.createMediaStreamDestination();

      this._scriptProcessorNode.connect(this._dummyDestinationNode);
    }

    _audioProcess(audioProcessingEvent: AudioProcessingEvent) {
      const leftChannelData: Float32Array = audioProcessingEvent.inputBuffer.getChannelData(0);
      const rightChannelData: Float32Array = audioProcessingEvent.inputBuffer.getChannelData(1);
      const interleaved: number[] = [];
      let interleavedIndex: number = 0;
      for (let i = 0; i < leftChannelData.length; i++) {
        interleaved[interleavedIndex++] = leftChannelData[i];
        interleaved[interleavedIndex++] = rightChannelData[i];
      }
      this._sampleDataSets.push(interleaved);
      this._sampleLength += leftChannelData.length + rightChannelData.length;
      this._sampleRate = audioProcessingEvent.inputBuffer.sampleRate;
    }

    exportWavBlob() {
      if (!this._sampleRate) {
        return;
      }

      const wavHeaderBlob: Blob = createWavHeaderBlob(this._sampleRate, this._sampleLength * 2);

      const arrayBuffer: ArrayBuffer = new ArrayBuffer(this._sampleLength * 2);
      const dataView: DataView = new DataView(arrayBuffer);

      let dataIndex: number = 0;
      this._sampleDataSets.forEach((sampleSet: number[]) => {
        sampleSet.forEach((sample: number) => {
          dataView.setInt16(2 * dataIndex, sample * 0x7FFF, true);
          dataIndex++;
        });
      });

      const dataBlob: Blob = new Blob([dataView], { type: wavBlobType });

      return new Blob([wavHeaderBlob, dataBlob], { type: wavBlobType });
    }
  };
}

export interface MediaStreamRecorderFactoryOptions {
  blobFactory?: typeof Blob;
  bufferFactory?: typeof Buffer;
  dataViewFactory?: typeof DataView;
}
