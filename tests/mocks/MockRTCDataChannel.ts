// tslint:disable no-empty

export const mockRTCDataChannelFactory = (
  options: MockRTCDataChannel.Options = {
    doClose: true,
    doMessage: true,
    doOpen: true,
  },
) => class {
  set onmessage(listener: (...args: any) => void) {
    setTimeout(() => options.doMessage && listener({ data: 'Ahoy, world!' }), 10);
  }
  set onopen(listener: (...args: any) => void) {
    setTimeout(() => options.doOpen && listener(), 5);
  }
  set onclose(listener: (...args: any) => void) {
    setTimeout(() => options.doClose && listener(), 20);
  }
  send() {}
};

export namespace MockRTCDataChannel {
  export interface Options {
    doClose: boolean;
    doMessage: boolean;
    doOpen: boolean;
  }
}
