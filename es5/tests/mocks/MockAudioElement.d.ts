export declare const mockAudioElementFactory: (options?: MockAudioElement.Options) => {
    new (): {
        loop: boolean;
        pause(): void;
        play(): Promise<void>;
        setAttribute(): void;
    };
};
export declare namespace MockAudioElement {
    interface Options {
        supportSetSinkId?: boolean;
    }
}
