import { MockAnalyserNode } from './MockAnalyserNode';
import { MockMediaElementAudioSourceNode } from './MockMediaElementAudioSourceNode';
import { MockMediaStreamAudioSourceNode } from './MockMediaStreamAudioSourceNode';
export declare const mockAudioContextFactory: (options?: MockAudioContext.Options) => {
    new (): {
        close(): void;
        createAnalyser(): MockAnalyserNode;
        createMediaElementSource(): MockMediaElementAudioSourceNode;
        createMediaStreamSource(): MockMediaStreamAudioSourceNode;
    };
};
export declare namespace MockAudioContext {
    interface Options {
        analyserNodeOptions: MockAnalyserNode.Options;
        doThrow?: {
            createAnalyser?: boolean;
            createMediaElementSource?: boolean;
            createMediaStreamSource?: boolean;
        };
    }
}
