import { MockMediaStream } from './MockMediaStream';
export declare function mockGetUserMediaFactory(options?: MockGetUserMediaOptions): () => Promise<MockMediaStream>;
export interface MockGetUserMediaOptions {
    mediaStream?: MockMediaStream;
}
