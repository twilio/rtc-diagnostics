// tslint:disable no-empty

export class MockAnalyserNode {
  static defaultOptions: MockAnalyserNode.Options = {
    volumeValues: 0,
  };
  fftSize = 0;
  smoothingTimeConstant = 0;
  private _options: MockAnalyserNode.Options;
  constructor(options: MockAnalyserNode.Options) {
    this._options = options;
  }
  disconnect() {}
  getByteFrequencyData(byteArray: Uint8Array) {
    byteArray.fill(this._options.volumeValues);
  }
  get frequencyBinCount() {
    return Math.ceil(this.fftSize / 2);
  }
}

export declare namespace MockAnalyserNode {
  export interface Options {
    volumeValues: number;
  }
}
