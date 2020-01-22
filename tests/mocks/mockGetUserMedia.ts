import { MockMediaStream } from './MockMediaStream';

export async function mockGetUserMedia(options: MockGetUserMediaOptions = {}) {
  return options.mediaStream || new MockMediaStream();
}

export interface MockGetUserMediaOptions {
  mediaStream?: MockMediaStream;
}
