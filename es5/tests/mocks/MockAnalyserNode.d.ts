export declare class MockAnalyserNode {
    static defaultOptions: MockAnalyserNode.Options;
    fftSize: number;
    smoothingTimeConstant: number;
    private _options;
    constructor(options?: MockAnalyserNode.Options);
    connect(): void;
    disconnect(): void;
    getByteFrequencyData(byteArray: Uint8Array): void;
    get frequencyBinCount(): number;
}
export declare namespace MockAnalyserNode {
    interface Options {
        volumeValues: number;
    }
}
