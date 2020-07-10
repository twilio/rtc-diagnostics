// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';
import { WarningName } from '../../lib/constants';
import { DiagnosticError } from '../../lib/errors/DiagnosticError';
import {
  InputTest,
  testInputDevice,
} from '../../lib/InputTest';
import { mockAudioContextFactory } from '../mocks/MockAudioContext';
import { mockEnumerateDevicesFactory } from '../mocks/mockEnumerateDevices';
import { mockGetUserMediaFactory } from '../mocks/mockGetUserMedia';
import { MockMediaStream } from '../mocks/MockMediaStream';
import { MockTrack } from '../mocks/MockTrack';

function createTestOptions(
  overrides: Partial<InputTest.Options> = {},
): InputTest.Options {
  return {
    audioContextFactory: mockAudioContextFactory() as any,
    duration: 1000,
    enumerateDevices: mockEnumerateDevicesFactory({
      devices: [{ deviceId: 'default', kind: 'audioinput' } as any],
    }),
    getUserMedia: mockGetUserMediaFactory({
      mediaStream: new MockMediaStream({
        tracks: [new MockTrack()],
      }),
    }) as any,
    volumeEventIntervalMs: 100,
    ...overrides,
  };
}

describe('testInputDevice', function() {
  let clock: sinon.SinonFakeTimers;

  before(function() {
    clock = sinon.useFakeTimers();
  });

  after(function() {
    sinon.restore();
  });

  function createBasicTest(
    testOptions: InputTest.Options,
  ) {
    const handlers = {
      [InputTest.Events.End]: sinon.stub(),
      [InputTest.Events.Error]: sinon.stub(),
      [InputTest.Events.Volume]: sinon.stub(),
      [InputTest.Events.Warning]: sinon.stub(),
      [InputTest.Events.WarningCleared]: sinon.stub(),
    };

    const inputTest = testInputDevice(testOptions);
    inputTest.on(InputTest.Events.Error, handlers.error);
    inputTest.on(InputTest.Events.Volume, handlers.volume);
    inputTest.on(InputTest.Events.End, handlers.end);
    inputTest.on(InputTest.Events.WarningCleared, handlers['warning-cleared']);
    inputTest.on(InputTest.Events.Warning, handlers.warning);

    const resetHandlers =
      () => Object.values(handlers).forEach(handler => handler.reset());

    return {
      handlers,
      inputTest,
      resetHandlers,
    };
  }

  describe('in a supported environment', function() {
    it('should properly warn the user when low audio levels should be detected', async function() {
      const testOptions = createTestOptions({
        audioContextFactory: mockAudioContextFactory({
          analyserNodeOptions: { volumeValues: 0 },
        }) as any,
        duration: Infinity,
      });
      const {
        handlers,
        inputTest,
        resetHandlers,
      } = createBasicTest(testOptions);

      await clock.tickAsync(5000);

      assert(handlers.error.notCalled);
      assert(handlers.volume.called);
      assert(handlers.volume.args.every(([v]) => v === 0));
      assert(handlers.end.notCalled);
      assert(handlers.warning.calledOnce);
      assert(handlers.warning.args[0][0] === WarningName.LowAudioLevel);

      resetHandlers();

      const original = inputTest['_onVolume'].bind(inputTest);
      inputTest['_onVolume'] = () => {
        original(100);
      };

      await clock.tickAsync(5000);

      assert(handlers.volume.called);
      assert(handlers.volume.args.every(([v]) => v === 100));
      assert(handlers.end.notCalled);
      assert(handlers.warning.notCalled);
      assert(handlers['warning-cleared'].calledOnce);
      assert(handlers['warning-cleared'].args[0][0] === WarningName.LowAudioLevel);

      resetHandlers();

      inputTest.stop();

      await clock.runAllAsync();

      [
        handlers.volume,
        handlers.error,
        handlers.warning,
        handlers['warning-cleared'],
      ].forEach(h => {
        assert(h.notCalled);
      });

      assert(handlers.end.calledOnce);
    });

    describe('when all volume values are all 0', function() {
      let errorHandler: sinon.SinonStub;
      let volumeHandler: sinon.SinonStub;
      let endHandler: sinon.SinonStub;

      before(async function() {
        const options = createTestOptions({
          audioContextFactory: mockAudioContextFactory({
            analyserNodeOptions: { volumeValues: 0 },
          }) as any,
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        endHandler = handlers.end;
        errorHandler = handlers.error;
        volumeHandler = handlers.volume;
      });

      it('should not have emitted any error event', function() {
        assert(errorHandler.notCalled);
      });

      it('should have emitted at least one volume event', function() {
        assert(volumeHandler.called);
      });

      it('should generate a valid report', function() {
        assert(endHandler.calledOnce);
        const report: InputTest.Report = endHandler.args[0][0];
        assert(report);
        assert(!report.didPass);
        assert.equal(report.values.length, volumeHandler.callCount);
        assert(report.values.every(v => v === 0));
      });
    });

    describe('when all volume values are all 100', function() {
      let errorHandler: sinon.SinonStub;
      let volumeHandler: sinon.SinonStub;
      let endHandler: sinon.SinonStub;

      before(async function() {
        const options = createTestOptions({
          audioContextFactory: mockAudioContextFactory({
            analyserNodeOptions: { volumeValues: 100 },
          }) as any,
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        endHandler = handlers.end;
        errorHandler = handlers.error;
        volumeHandler = handlers.volume;
      });

      it('should not have emitted any error event', function() {
        assert(errorHandler.notCalled);
      });

      it('should have emitted at least one volume event', function() {
        assert(volumeHandler.called);
      });

      it('should generate a valid report', function() {
        assert(endHandler.calledOnce);
        const report: InputTest.Report = endHandler.args[0][0];
        assert(report);
        assert(report.didPass);
        assert.equal(report.values.length, volumeHandler.callCount);
        assert(report.values.every(v => v === 100));
      });
    });
  });

  describe('in an unsupported environment', function() {
    describe('it should immediately end and report an error', function() {
      ([ [
        'AudioContext', createTestOptions({ audioContextFactory: undefined }),
      ], [
        'getUserMedia', createTestOptions({ getUserMedia: undefined }),
      ], [
        'enumerateDevices', createTestOptions({ enumerateDevices: undefined }),
      ] ] as const).forEach(([title, options]) => {
        it(`when ${title} is not supported`, async function() {
          const { handlers } = createBasicTest(options);
          await clock.runAllAsync();
          const endHandler = handlers.end;
          const errorHandler = handlers.error;
          const volumeHandler = handlers.volume;

          assert(endHandler.calledOnce);
          const report: InputTest.Report = endHandler.args[0][0];
          assert(report);
          assert(!report.didPass);
          assert(errorHandler.calledOnce);
          assert(errorHandler.calledBefore(endHandler));
          assert(volumeHandler.notCalled);
        });
      });
    });
  });

  it('should throw if passed invalid options', async function() {
    const invalidOptions = [{
      deviceId: 0,
    }, {
      deviceId: {},
    }, {
      duration: -10,
    }, {
      duration: {},
    }, {
      volumeEventIntervalMs: -10,
    }, {
      volumeEventIntervalMs: {},
    }] as any;

    for (const overrides of invalidOptions) {
      const options = createTestOptions(overrides);
      const { handlers } = createBasicTest(options);
      await clock.runAllAsync();
      assert(handlers.end.calledOnce);
      assert(handlers.error.calledOnce);
      assert(handlers.end.calledAfter(handlers.error));
      assert(handlers.volume.notCalled);
    }
  });

  it('should warn if stopped multiple times', async function() {
    const consoleStub = sinon.stub(console, 'warn');
    try {
      const options = createTestOptions({ debug: true });
      const test = testInputDevice(options);
      const report = test.stop();
      assert(report);
      const shouldBeUndefined = test.stop();
      assert.equal(shouldBeUndefined, undefined);
      assert(consoleStub.calledOnce);
    } finally {
      await clock.runAllAsync();
      consoleStub.restore();
    }
  });

  describe('should handle when an error is thrown during the test', function() {
    ([ [
      'AudioContext', createTestOptions({
        audioContextFactory: mockAudioContextFactory({
          throw: { construction: new DiagnosticError() },
        }) as any,
      }),
    ], [
      'getUserMedia', createTestOptions({
        getUserMedia: mockGetUserMediaFactory({
          throw: new DiagnosticError(),
        }) as any,
      }),
    ], [
      'enumerateDevices', createTestOptions({
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [],
          throw: new DiagnosticError(),
        }) as any,
      }),
    ] ] as const).forEach(([title, options]) => {
      it(`by ${title}`, async function() {
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        assert(handlers.end.calledOnce);
        const report: InputTest.Report = handlers.end.args[0][0];
        assert(report);
        assert(!report.didPass);
        assert(handlers.error.calledOnce);
        assert(handlers.error.calledBefore(handlers.end));
        assert(handlers.volume.notCalled);
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
          audioContextFactory: mockAudioContextFactory({
            throw: { construction: error },
          }) as any,
        });
        const { handlers } = createBasicTest(options);
        await clock.runAllAsync();
        assert(handlers.end.calledOnce);
        assert(handlers.error.calledOnce);
        assert(handlers.end.calledAfter(handlers.error));
        assert(handlers.volume.notCalled);

        const handledError = handlers.error.args[0][0];
        const report: InputTest.Report = handlers.end.args[0][0];
        assert(!report.didPass);
        assert.equal(report.errors.length, 1);
        assert.equal(handledError, report.errors[0]);
      });
    });
  });
});
