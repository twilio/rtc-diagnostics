export declare class MockHTMLMediaElement {
    src: string | null;
    srcObject: MediaStream | null;
    load(): void;
    pause(): void;
    play(): Promise<void>;
}
