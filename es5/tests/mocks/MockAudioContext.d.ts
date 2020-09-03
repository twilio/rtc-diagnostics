import { MockAnalyserNode } from './MockAnalyserNode';
import { MockMediaElementAudioSourceNode } from './MockMediaElementAudioSourceNode';
import { MockMediaStreamAudioDestinationNode } from './MockMediaStreamAudioDestinationNode';
import { MockMediaStreamAudioSourceNode } from './MockMediaStreamAudioSourceNode';
export declare const mockAudioContextFactory: (options?: MockAudioContext.Options) => {
    new (): {
        close(): void;
        createAnalyser(): MockAnalyserNode;
        createMediaElementSource(): MockMediaElementAudioSourceNode;
        createMediaStreamDestination(): MockMediaStreamAudioDestinationNode;
        createMediaStreamSource(): MockMediaStreamAudioSourceNode;
    };
};
export declare namespace MockAudioContext {
    interface Options {
        analyserNodeOptions?: MockAnalyserNode.Options;
        throw?: {
            construction?: any;
            createAnalyser?: any;
            createMediaElementSource?: any;
            createMediaStreamDestination?: any;
            createMediaStreamSource?: any;
        };
    }
}
