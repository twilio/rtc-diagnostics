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
  close() {}
  createAnalyser() {
    if (options.doThrow && options.doThrow.createAnalyser) {
      throw new DiagnosticError();
    }
    return new MockAnalyserNode(options.analyserNodeOptions);
  }
  createMediaElementSource() {
    if (options.doThrow && options.doThrow.createMediaElementSource) {
      throw new DiagnosticError();
    }
    return new MockMediaElementAudioSourceNode();
  }
  createMediaStreamDestination() {
    if (options.doThrow?.createMediaStreamDestination) {
      throw new DiagnosticError();
    }
    return new MockMediaStreamAudioDestinationNode();
  }
  createMediaStreamSource() {
    if (options.doThrow && options.doThrow.createMediaStreamSource) {
      throw new DiagnosticError();
    }
    return new MockMediaStreamAudioSourceNode();
  }
};

export declare namespace MockAudioContext {
  export interface Options {
    analyserNodeOptions: MockAnalyserNode.Options;
    doThrow?: {
      createAnalyser?: boolean;
      createMediaElementSource?: boolean;
      createMediaStreamDestination?: boolean;
      createMediaStreamSource?: boolean;
    };
  }
}
