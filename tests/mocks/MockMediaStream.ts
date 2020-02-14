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
}

export declare namespace MockMediaStream {
  interface Options {
    tracks: MockTrack[];
  }
}
