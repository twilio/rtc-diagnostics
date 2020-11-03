import * as sinon from 'sinon';
import { MockMediaStream } from './MockMediaStream';
export declare function mockGetUserMediaFactory(opts?: MockGetUserMediaOptions): sinon.SinonStub<any[], any>;
export interface MockGetUserMediaOptions {
    mediaStream?: MockMediaStream;
    throw?: any;
}
