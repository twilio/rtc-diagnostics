export declare function mockEnumerateDevicesFactory(options?: {
    devices: MediaDeviceInfo[];
    throw?: any;
}): () => Promise<MediaDeviceInfo[]>;
