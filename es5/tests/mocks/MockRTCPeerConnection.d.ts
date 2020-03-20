import { MockRTCDataChannel } from './MockRTCDataChannel';
export declare const mockRTCPeerConnectionFactory: (options: MockRTCPeerConnection.Options) => {
    new (): {
        addIceCandidate(): void;
        close(): void;
        createAnswer(): Promise<void>;
        createDataChannel(): {
            onmessage: (...args: any) => void;
            onopen: (...args: any) => void;
            onclose: (...args: any) => void;
            send(): void;
        };
        createOffer(): Promise<void>;
        ondatachannel: (...args: any[]) => void;
        onicecandidate: (...args: any[]) => void;
        setLocalDescription(): Promise<void>;
        setRemoteDescription(): Promise<void>;
    };
};
export declare namespace MockRTCPeerConnection {
    interface Options {
        candidate?: any;
        doThrow?: {
            createOffer?: boolean;
        };
        mockRTCDataChannelFactoryOptions: MockRTCDataChannel.Options;
    }
}
