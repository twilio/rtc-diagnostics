// tslint:disable no-empty

import {
  MockRTCDataChannel,
  mockRTCDataChannelFactory,
} from './MockRTCDataChannel';

export const mockRTCPeerConnectionFactory = (
  options: MockRTCPeerConnection.Options,
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
    async createOffer() {}
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
    mockRTCDataChannelFactoryOptions: MockRTCDataChannel.Options;
  }
}
