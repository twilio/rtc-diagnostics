// tslint:disable no-empty

import { DiagnosticError } from '../../lib/errors';
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
    if (this._options.doThrow && this._options.doThrow.createAnalyser) {
      throw new DiagnosticError();
    }
    return new MockAnalyserNode(this._options.analyserNodeOptions);
  }
  createMediaElementSource() {
    if (this._options.doThrow && this._options.doThrow.createMediaElementSource) {
      throw new DiagnosticError();
    }
    return new MockMediaElementAudioSourceNode();
  }
  createMediaStreamSource() {
    if (this._options.doThrow && this._options.doThrow.createMediaStreamSource) {
      throw new DiagnosticError();
    }
    return new MockMediaStreamAudioSourceNode();
  }
}

export declare namespace MockAudioContext {
  export interface Options {
    analyserNodeOptions: MockAnalyserNode.Options;
    doThrow?: {
      createAnalyser?: boolean;
      createMediaElementSource?: boolean;
      createMediaStreamSource?: boolean;
    };
  }
}
