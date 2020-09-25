export declare class MockTrack {
    kind: 'video' | 'audio';
    srcObject: MediaStream | null;
    constructor(options: {
        kind: MockTrack['kind'];
    });
    getSettings(): MediaTrackSettings;
    stop(): void;
}
