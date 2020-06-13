import { EventEmitter } from 'events';
import { mockBlobFactory } from './MockBlob';

export const defaultBlobEvent = {
  data: new (mockBlobFactory())(),
  type: 'dataavailable',
};

export function mockMediaRecorderFactory(opts: {
  blobEvent?: any,
  throw?: { construction?: any, start?: any, stop?: any },
} = {}) {
  const options = { blobEvent: defaultBlobEvent, ...opts };
  return class MockMediaRecorder extends EventEmitter {
    addEventListener = this.addListener;
    interval: NodeJS.Timeout | null = null;
    removeEventListener = this.removeListener;
    stream: MediaStream;
    constructor(stream: MediaStream) {
      super();
      if (options.throw?.construction) {
        throw options.throw.construction;
      }
      this.stream = stream;
    }
    start(intervalMs: number) {
      if (options.throw?.start) {
        throw options.throw.start;
      }
      this.interval = setInterval(
        () => this.emit('dataavailable', options.blobEvent),
        intervalMs,
      );
    }
    stop() {
      if (options.throw?.stop) {
        throw options.throw.stop;
      }
      if (this.interval) {
        clearInterval(this.interval);
      }
      this.emit('stop');
    }
  };
}
