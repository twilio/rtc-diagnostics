import { MockMediaStream } from './MockMediaStream';

export async function mockGetUserMedia() {
  return new MockMediaStream();
}
