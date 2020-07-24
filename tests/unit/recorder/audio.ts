// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';
import { AudioRecorder } from '../../../lib/recorder/audio';

describe('AudioRecorder', () => {
  const root: any = global;
  let audioRecorder: AudioRecorder;
  let audioContext: any;
  let mediaRecorderInstance: any;
  let blobInstance: any;
  let stream: any;
  let mediaStreamTrack1: any;
  let mediaStreamTrack2: any;
  let MediaRecorderFactory: any;
  let origBlob: any;
  let origURL: any;

  beforeEach(() => {
    origBlob = root.Blob;
    origURL = root.URL;

    root.Blob = function(this: any, audioData: any[], options: any) {
      this.audioData = audioData;
      this.options = options;
      blobInstance = this;
    };
    root.URL = {createObjectURL: (blob: any) => blob.audioData.join()};

    audioContext = {};
    mediaStreamTrack1 = {stop: sinon.stub()};
    mediaStreamTrack2 = {stop: sinon.stub()};
    stream = {
      clone: sinon.stub().returns({
        getTracks: () => ([
          mediaStreamTrack1,
          mediaStreamTrack2,
        ]),
      }),
    };
    MediaRecorderFactory = function(this: any) {
      this.start = sinon.stub();
      this.stop = sinon.stub().callsFake(() => {
        this.onstop();
      });
      mediaRecorderInstance = this;
    };
    audioRecorder = new AudioRecorder({ stream, MediaRecorderFactory, audioContext });
  });

  afterEach(() => {
    root.Blob = origBlob;
    root.URL = origURL;
  });

  it('should use a clone of the MediaStream', () => {
    sinon.assert.calledOnce(stream.clone);
  });

  it('should start recording media', () => {
    sinon.assert.calledOnce(mediaRecorderInstance.start);
  });

  it('should reject if stop is called more than once', () => {
    assert(audioRecorder.stop());
    assert.rejects(audioRecorder.stop());
  });

  it('should reject if generating url fails', () => {
    root.Blob = function() {
      throw new Error('foo err');
    };
    assert.rejects(audioRecorder.stop());
  });

  it('should stop media recorder', () => {
    audioRecorder.stop();
    sinon.assert.calledOnce(mediaRecorderInstance.stop);
  });

  it('should stop MediaStreamTracks on stop', () => {
    audioRecorder.stop();
    sinon.assert.calledOnce(mediaStreamTrack1.stop);
    sinon.assert.calledOnce(mediaStreamTrack2.stop);
  });

  it('should generate url from audioData', () => {
    mediaRecorderInstance.ondataavailable({data: 'foo'});
    mediaRecorderInstance.ondataavailable({data: 'bar'});
    mediaRecorderInstance.ondataavailable({data: 'baz'});
    audioRecorder.stop();
    assert.equal(audioRecorder.url, 'foo,bar,baz');
  });
});
