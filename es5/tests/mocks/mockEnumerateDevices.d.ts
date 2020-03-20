export declare function mockEnumerateDevicesFactory(options?: {
    devices: MediaDeviceInfo[];
    doThrow?: any;
}): () => Promise<MediaDeviceInfo[]>;
