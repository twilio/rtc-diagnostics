// tslint:disable only-arrow-functions

import * as sinon from 'sinon';
import { Encoder } from '../../../../lib/recorder/encoder';

describe('Audio Encoder', () => {
  const root: any = global;
  const stream: any = {};
  const waveEncoder: any = {};

  let audioContext: any;
  let processor: any;
  let audioEncoder: any;
  let workerInstance: any;
  let origWorker: any;
  let origBlob: any;
  let origURL: any;

  beforeEach(() => {
    origBlob = root.Blob;
    origURL = root.URL;
    origWorker = root.Worker;
    root.URL = {createObjectURL: () => undefined};
    root.Blob = function() {
      return undefined;
    };

    root.Worker = function() {
      this.data = [];
      this.addEventListener = (name: string, cb: Function) => {
        this.onMessageHandler = cb;
      };
      this.postMessage = (args: any[]) => {
        const command = args[0];
        if (command === 'encode') {
          this.data.push(args[1]);
        } else if (command === 'dump') {
          this.onMessageHandler(this.data.join());
        }
      };
      workerInstance = this;
    };

    processor = {connect: () => undefined};
    audioContext = {
      createMediaStreamSource: () => ({connect: () => undefined}),
      createScriptProcessor: () => processor,
    };

    audioEncoder = new Encoder(stream, audioContext, waveEncoder);
  });

  afterEach(() => {
    root.Worker = origWorker;
    root.Blob = origBlob;
    root.URL = origURL;
  });

  it('should not crash if a customer encoder is not provided', () => {
    audioEncoder = new Encoder(stream, audioContext);
  });

  describe('without handlers', () => {
    it('should not crash if onstop and ondataavailable are not provided', () => {
      audioEncoder.start();
      processor.onaudioprocess({inputBuffer: {getChannelData: () => 'foo'}});
      audioEncoder.stop();
    });
  });

  describe('with handlers', () => {
    beforeEach(() => {
      audioEncoder.ondataavailable = sinon.stub();
      audioEncoder.onstop = sinon.stub();
    });

    it('should call ondataavailable handler', () => {
      audioEncoder.start();
      processor.onaudioprocess({inputBuffer: {getChannelData: () => 'foo'}});
      processor.onaudioprocess({inputBuffer: {getChannelData: () => 'bar'}});
      processor.onaudioprocess({inputBuffer: {getChannelData: () => 'baz'}});
      audioEncoder.stop();
      sinon.assert.calledWithExactly(audioEncoder.ondataavailable, 'foo,bar,baz');
    });

    it('should call onstop handler', () => {
      audioEncoder.start();
      processor.onaudioprocess({inputBuffer: {getChannelData: () => 'foo'}});
      audioEncoder.stop();
      sinon.assert.calledOnce(audioEncoder.onstop);
    });
  });
});
