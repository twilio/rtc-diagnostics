// tslint:disable no-empty

import {
  MockRTCDataChannel,
  mockRTCDataChannelFactory,
} from './MockRTCDataChannel';

export const mockRTCPeerConnectionFactory = (
  options: MockRTCPeerConnection.Options = {
    candidate: 'test',
  },
) => {
  const mockRTCDataChannel =
    mockRTCDataChannelFactory(options.mockRTCDataChannelFactoryOptions);
  return class {
    addIceCandidate() {}
    close() {}
    async createAnswer() {}
    createDataChannel() {
      return new mockRTCDataChannel();
    }
    async createOffer() {
      if (options.doThrow?.createOffer) {
        throw new Error();
      }
    }
    getStats: (...args: any[]) => Promise<any> = () => {
      return new Promise((...args: any[]) => {});
    }
    ondatachannel: (...args: any[]) => void = () => {};
    onicecandidate: (...args: any[]) => void = () => {};
    async setLocalDescription() {}
    async setRemoteDescription() {
      this.ondatachannel({ channel: new mockRTCDataChannel() });
      this.onicecandidate({ candidate: options.candidate });
    }
  };
};

export namespace MockRTCPeerConnection {
  export interface Options {
    candidate?: any;
    doThrow?: {
      createOffer?: boolean;
    };
    mockRTCDataChannelFactoryOptions?: MockRTCDataChannel.Options;
  }
}
