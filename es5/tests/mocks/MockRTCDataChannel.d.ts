export declare const mockRTCDataChannelFactory: (options?: MockRTCDataChannel.Options) => {
    new (): {
        onmessage: (...args: any) => void;
        onopen: (...args: any) => void;
        onclose: (...args: any) => void;
        send(): void;
    };
};
export declare namespace MockRTCDataChannel {
    interface Options {
        doClose: boolean;
        doMessage: boolean;
        doOpen: boolean;
    }
}
