// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';
import { DiagnosticError } from '../../lib/errors';
import {
  testVideoInputDevice,
  VideoInputTest,
} from '../../lib/VideoInputTest';
import { mockGetUserMediaFactory } from '../mocks/mockGetUserMedia';
import { MockHTMLMediaElement } from '../mocks/MockHTMLMediaElement';
import { MockMediaStream } from '../mocks/MockMediaStream';
import { MockTrack } from '../mocks/MockTrack';

function createTestOptions(
  overrides: Partial<VideoInputTest.Options> = {},
): VideoInputTest.Options {
  return {
    duration: 1000,
    getUserMedia: mockGetUserMediaFactory({
      mediaStream: new MockMediaStream({
        tracks: [new MockTrack({ kind: 'video' })],
      }),
    }) as any,
    ...overrides,
  };
}

describe('testVideoInputDevice', function() {
  let clock: sinon.SinonFakeTimers;

  before(function() {
    clock = sinon.useFakeTimers();
  });

  after(function() {
    sinon.restore();
  });

  function createBasicTest(
    testOptions: VideoInputTest.Options,
  ) {
    const handlers = {
      [VideoInputTest.Events.End]: sinon.stub(),
      [VideoInputTest.Events.Error]: sinon.stub(),
    };

    const videoInputTest = testVideoInputDevice(testOptions);
    videoInputTest.on(VideoInputTest.Events.Error, handlers.error);
    videoInputTest.on(VideoInputTest.Events.End, handlers.end);

    const resetHandlers =
      () => Object.values(handlers).forEach(handler => handler.reset());

    return {
      handlers,
      resetHandlers,
      videoInputTest,
    };
  }

  it('should throw if passed invalid options', async function() {
    const invalidOptions = [{
      deviceId: 0,
    }, {
      deviceId: {},
    }, {
      duration: -10,
    }, {
      duration: {},
    }] as any;

    for (const overrides of invalidOptions) {
      const options = createTestOptions(overrides);
      const { handlers } = createBasicTest(options);
      await clock.runAllAsync();
      assert(handlers.end.calledOnce);
      assert(handlers.error.calledOnce);
      assert(handlers.end.calledAfter(handlers.error));
    }
  });

  it('should warn if stopped multiple times', async function() {
    const consoleStub = sinon.stub(console, 'warn');
    try {
      const options = createTestOptions({ debug: true });
      const test = testVideoInputDevice(options);
      test.stop();
      test.stop();
      assert(consoleStub.calledOnce);
    } finally {
      await clock.runAllAsync();
      consoleStub.restore();
    }
  });

  describe('in a supported environment', function() {
    describe('when `getUserMedia` returns a valid stream', function() {
      let errorHandler: sinon.SinonStub;
      let endHandler: sinon.SinonStub;
      let trackStub: sinon.SinonStub<[], void>;

      before(async function() {
        const track = new MockTrack({ kind: 'video' });
        trackStub = sinon.stub(track, 'stop');
        const options = createTestOptions({
          getUserMedia: mockGetUserMediaFactory({
            mediaStream: new MockMediaStream({
              tracks: [track],
            }),
          }),
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        endHandler = handlers.end;
        errorHandler = handlers.error;
      });

      it('should not have emitted any error event', function() {
        assert(errorHandler.notCalled);
      });

      it('should generate a valid report', function() {
        assert(endHandler.calledOnce);
        const report: VideoInputTest.Report = endHandler.args[0][0];
        assert(report);
      });

      it('should have cleaned up the stream', function() {
        assert(trackStub.calledOnce);
      });
    });

    describe('when a video element is provided', function() {
      let errorHandler: sinon.SinonStub;
      let endHandler: sinon.SinonStub;
      let pauseStub: sinon.SinonStub;
      let playStub: sinon.SinonStub;
      let setSrcObjectStub: sinon.SinonStub;
      let mediaStream: MockMediaStream;

      before(async function() {
        const element: any = new MockHTMLMediaElement();
        pauseStub = sinon.stub(element, 'pause');
        playStub = sinon.stub(element, 'play').resolves();
        setSrcObjectStub = sinon.stub();
        sinon.stub(element, 'srcObject').set(setSrcObjectStub);
        mediaStream = new MockMediaStream({
          tracks: [new MockTrack({ kind: 'video' })],
        });
        const options = createTestOptions({
          element,
          getUserMedia: mockGetUserMediaFactory({
            mediaStream,
          }) as any,
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        endHandler = handlers.end;
        errorHandler = handlers.error;
      });

      it('should have ended successfully', function() {
        assert(endHandler.calledOnce);
        assert(errorHandler.notCalled);
      });

      it('should have called play on the element', function() {
        assert(playStub.calledOnce);
      });

      it('should have set the src object to the stream', function() {
        assert.equal(setSrcObjectStub.args[0][0], mediaStream);
      });

      it('should clean up the element', function() {
        assert.equal(setSrcObjectStub.args[1][0], null);
        assert(pauseStub.calledAfter(playStub));
        assert(pauseStub.calledOnce);
      });
    });
  });

  describe('in an unsupported environment', function() {
    describe('it should immediately end and report an error', function() {
      ([ [
        'getUserMedia', createTestOptions({ getUserMedia: undefined }),
      ] ] as const).forEach(([title, options]) => {
        it(`when ${title} is not supported`, async function() {
          const { handlers } = createBasicTest(options);
          await clock.runAllAsync();
          const endHandler = handlers.end;
          const errorHandler = handlers.error;

          assert(endHandler.calledOnce);
          const report: VideoInputTest.Report = endHandler.args[0][0];
          assert(report);
          assert(errorHandler.calledOnce);
          assert(errorHandler.calledBefore(endHandler));
        });
      });
    });
  });

  describe('should handle when an error is thrown during the test', function() {
    ([ [
      'getUserMedia', createTestOptions({
        getUserMedia: mockGetUserMediaFactory({
          throw: new DiagnosticError(),
        }) as any,
      }),
    ] ] as const).forEach(([title, options]) => {
      it(`by ${title}`, async function() {
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        assert(handlers.end.calledOnce);
        const report: VideoInputTest.Report = handlers.end.args[0][0];
        assert(report);
        assert(handlers.error.calledOnce);
        assert(handlers.error.calledBefore(handlers.end));
      });
    });

    ([ [
      'DiagnosticError', new DiagnosticError(),
    ], [
      'DOMException', new (global as any).DOMException(),
    ], [
      'DOMError', new (global as any).DOMError(),
    ], [
      'unknown error', new Error(),
    ] ] as const).forEach(([title, error]) => {
      it(`of type ${title}`, async function() {
        const options = createTestOptions({
          getUserMedia: mockGetUserMediaFactory({ throw: error }),
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        assert(handlers.end.calledOnce);
        assert(handlers.error.calledOnce);
        assert(handlers.end.calledAfter(handlers.error));

        const handledError = handlers.error.args[0][0];
        const report: VideoInputTest.Report = handlers.end.args[0][0];
        assert.equal(report.errors.length, 1);
        assert.equal(handledError, report.errors[0]);
      });
    });
  });
});
