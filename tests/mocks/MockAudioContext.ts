// tslint:disable no-empty

import { DiagnosticError } from '../../lib/errors';
import { MockAnalyserNode } from './MockAnalyserNode';
import { MockMediaElementAudioSourceNode } from './MockMediaElementAudioSourceNode';
import { MockMediaStreamAudioDestinationNode } from './MockMediaStreamAudioDestinationNode';
import { MockMediaStreamAudioSourceNode } from './MockMediaStreamAudioSourceNode';

const defaultMockAudioContextFactoryOptions: MockAudioContext.Options = {
  analyserNodeOptions: MockAnalyserNode.defaultOptions,
};

export const mockAudioContextFactory = (
  options: MockAudioContext.Options = defaultMockAudioContextFactoryOptions,
) => class {
  constructor() {
    if (options.throw?.construction) {
      throw options.throw.construction;
    }
  }
  close() {}
  createAnalyser() {
    if (options.throw?.createAnalyser) {
      throw options.throw.createAnalyser;
    }
    return new MockAnalyserNode(options.analyserNodeOptions);
  }
  createMediaElementSource() {
    if (options.throw?.createMediaElementSource) {
      throw options.throw.createMediaElementSource;
    }
    return new MockMediaElementAudioSourceNode();
  }
  createMediaStreamDestination() {
    if (options.throw?.createMediaStreamDestination) {
      throw options.throw.createMediaStreamDestination;
    }
    return new MockMediaStreamAudioDestinationNode();
  }
  createMediaStreamSource() {
    if (options.throw?.createMediaStreamSource) {
      throw options.throw.createMediaStreamSource;
    }
    return new MockMediaStreamAudioSourceNode();
  }
};

export declare namespace MockAudioContext {
  export interface Options {
    analyserNodeOptions?: MockAnalyserNode.Options;
    throw?: {
      construction?: any;
      createAnalyser?: any;
      createMediaElementSource?: any;
      createMediaStreamDestination?: any;
      createMediaStreamSource?: any;
    };
  }
}
