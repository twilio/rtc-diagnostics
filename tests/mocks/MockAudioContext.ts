// tslint:disable no-empty

import { MockAnalyserNode } from './MockAnalyserNode';
import { MockMediaElementAudioSourceNode } from './MockMediaElementAudioSourceNode';
import { MockMediaStreamAudioSourceNode } from './MockMediaStreamAudioSourceNode';

export class MockAudioContext {
  static defaultOptions: MockAudioContext.Options = {
    analyserNodeOptions: MockAnalyserNode.defaultOptions,
  };
  private _options: MockAudioContext.Options;
  constructor(options: Partial<MockAudioContext.Options> = {}) {
    this._options = { ...MockAudioContext.defaultOptions, ...options };
  }
  close() {}
  createAnalyser() {
    return new MockAnalyserNode(this._options.analyserNodeOptions);
  }
  createMediaElementSource() {
    return new MockMediaElementAudioSourceNode();
  }
  createMediaStreamSource() {
    return new MockMediaStreamAudioSourceNode();
  }
}

export declare namespace MockAudioContext {
  export interface Options {
    analyserNodeOptions: MockAnalyserNode.Options;
  }
}
