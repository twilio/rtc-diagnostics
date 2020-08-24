import { MockTrack } from './MockTrack';

export class MockMediaStream {
  static defaultOptions: MockMediaStream.Options = {
    tracks: [],
  };
  options: MockMediaStream.Options;
  constructor(options: Partial<MockMediaStream.Options> = {}) {
    this.options = { ...MockMediaStream.defaultOptions, ...options };
  }
  getTracks() {
    return this.options.tracks as any[];
  }
  getVideoTracks() {
    return this.options.tracks.filter(
      (track: MockTrack) => track.kind === 'video',
    );
  }
}

export declare namespace MockMediaStream {
  interface Options {
    tracks: MockTrack[];
  }
}
