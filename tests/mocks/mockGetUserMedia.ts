import { MockMediaStream } from './MockMediaStream';

export function mockGetUserMedia() {
  return new MockMediaStream();
}
