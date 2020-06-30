import * as sinon from 'sinon';
import { MockMediaStream } from './MockMediaStream';

export function mockGetUserMediaFactory(opts: MockGetUserMediaOptions = {}) {
  const options = {
    mediaStream: new MockMediaStream(),
    ...opts,
  };

  return options.throw
    ? sinon.stub().rejects(options.throw)
    : sinon.stub().resolves(options.mediaStream);
}

export interface MockGetUserMediaOptions {
  mediaStream?: MockMediaStream;
  throw?: any;
}
