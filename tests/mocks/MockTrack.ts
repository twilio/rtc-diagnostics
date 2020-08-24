// tslint:disable no-empty

export class MockTrack {
  kind: 'video' | 'audio';
  srcObject: MediaStream | null = null;
  constructor(options: { kind: MockTrack['kind'] }) {
    this.kind = options.kind;
  }
  getSettings(): MediaTrackSettings {
    return {
      height: 1080,
      width: 1920,
    };
  }
  stop() {}
}
