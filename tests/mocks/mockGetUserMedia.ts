import { MockMediaStream } from './MockMediaStream';

export function mockGetUserMediaFactory(options: MockGetUserMediaOptions = {}) {
  return async function mockGetUserMedia() {
    return options.mediaStream || new MockMediaStream();
  }
}

export interface MockGetUserMediaOptions {
  mediaStream?: MockMediaStream;
}
