// tslint:disable only-arrow-functions

import * as assert from 'assert';
import { DiagnosticError } from '../../lib/errors';
import {
  OutputTest,
  testOutputDevice,
} from '../../lib/OutputTest';
import { AudioElement } from '../../lib/types';
import { MockAudioContext, mockAudioContextFactory } from '../mocks/MockAudioContext';
import { mockAudioElementFactory } from '../mocks/MockAudioElement';

const defaultDuration = 5;
const defaultPollIntervalMs = 1;

describe('testOutputDevice', function() {
  const audioElementFactory: (new () => AudioElement) = mockAudioElementFactory({
    supportSetSinkId: true,
  }) as any;

  const volumeValues = 100;
  describe(`with volume values of ${volumeValues}`, function() {
    let report: OutputTest.Report;

    before(async function() {
      const audioContextFactory: typeof AudioContext = mockAudioContextFactory({
        analyserNodeOptions: { volumeValues },
      }) as any;

      report = await new Promise(resolve => {
        testOutputDevice(undefined, {
          audioContextFactory,
          audioElementFactory,
          duration: defaultDuration,
          pollIntervalMs: defaultPollIntervalMs,
        }).on(OutputTest.Events.End, (_p, r) => resolve(r));
      });
    });

    it('should pass', function() {
      assert(report.didPass);
    });

    it('both start and end timestamps should be set', function() {
      assert(report.startTime);
      assert(report.endTime);
    });

    it(`all volume values should be ${volumeValues}`, function() {
      assert(report.values.every(v => v === volumeValues));
    });
  });

  describe('with volume values of 0', function() {
    let report: OutputTest.Report;

    before(async function() {
      const audioContextFactory: typeof AudioContext = mockAudioContextFactory({
        analyserNodeOptions: { volumeValues: 0 },
      }) as any;

      report = await new Promise(resolve => {
        testOutputDevice(undefined, {
          audioContextFactory,
          audioElementFactory,
          duration: defaultDuration,
          pollIntervalMs: defaultPollIntervalMs,
        }).on(OutputTest.Events.End, (_p, r) => resolve(r));
      });
    });

    it('should pass', function() {
      assert(report.didPass);
    });

    it('both start and end timestamps should be set', function() {
      assert(report.startTime);
      assert(report.endTime);
    });

    it('all volume values should be 0', function() {
      assert(report.values.every(v => v === 0));
    });
  });

  it('should report a failure if allowed to timeout and `passOnTimeout === false`', async function() {
    const result: { error?: DiagnosticError, report?: OutputTest.Report } = {};
    await new Promise(resolve => {
      const test = testOutputDevice(undefined, {
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory,
        duration: defaultDuration,
        passOnTimeout: false,
        pollIntervalMs: defaultPollIntervalMs,
      });
      test.on(OutputTest.Events.Error, err => {
        result['error'] = err;
        if (result.error && result.report) {
          resolve(result);
        }
      });
      test.on(OutputTest.Events.End, (_, r) => {
        result['report'] = r;
        if (result.error && result.report) {
          resolve(result);
        }
      });
    });
    assert(result.report);
    assert(result.error);
    assert.equal(result.error!.message, 'Test timed out.');
    assert.equal(result.report!.didPass, false);
    assert.equal(result.report!.errors.length, 1);
    assert.equal(result.error, result.report!.errors[0]);
  });

  describe('should immediately end and report an error', function() {
    // not providing the mock object here results in the test resorting to the
    // global
    // because these are unit tests, and node does not have these globals,
    // they are null and are essentially "not supported"

    it('when AudioContext is not supported', async function() {
      const report: OutputTest.Report = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          audioElementFactory,
        });
        test.on(OutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(OutputTest.Events.End, (_, r) => resolve(r));
      });
      assert(report);
      assert.equal(report.didPass, false);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, 'UnsupportedError');
    });
    it('when Audio is not supported', async function() {
      const report: OutputTest.Report = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          audioContextFactory: mockAudioContextFactory() as any,
        });
        test.on(OutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(OutputTest.Events.End, (_, r) => resolve(r));
      });
      assert(report);
      assert.equal(report.didPass, false);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, 'UnsupportedError');
    });
    it('when neither AudioContext or Audio is supported', async function() {
      const report: OutputTest.Report = await new Promise(resolve => {
        const test = testOutputDevice();
        test.on(OutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(OutputTest.Events.End, (_, r) => resolve(r));
      });
      assert(report);
      assert.equal(report.didPass, false);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, 'UnsupportedError');
    });
  });

  it('should throw if stopped twice', function() {
    const test = testOutputDevice(undefined, {
      audioContextFactory: mockAudioContextFactory({
        analyserNodeOptions: { volumeValues: 100 },
      }) as any,
      audioElementFactory,
      debug: false, // prevent console warnings
    });
    const report = test.stop(false);
    assert(report);
    const shouldBeUndefined = test.stop(false);
    assert.equal(shouldBeUndefined, undefined);
  });

  it('should report an error if the audio context throws', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testOutputDevice(undefined, {
        audioContextFactory: mockAudioContextFactory({
          analyserNodeOptions: { volumeValues: 100 },
          doThrow: { createAnalyser: true },
        }) as any,
        audioElementFactory,
        duration: defaultDuration,
        pollIntervalMs: defaultPollIntervalMs,
      });
      test.on(OutputTest.Events.Error, err => reject(err));
    }));
  });

  it('should allow `deviceId` if `setSinkId` is supported', async function() {
    const report = await new Promise(resolve => {
      const test = testOutputDevice('foobar', {
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory,
        duration: defaultDuration,
        pollIntervalMs: defaultPollIntervalMs,
      });
      test.on(OutputTest.Events.End, r => resolve(r));
      test.stop(true);
    });
    assert(report);
  });

  it('should not allow `deviceId` if `setSinkId` is unsupported', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testOutputDevice('foobar', {
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory: mockAudioElementFactory({ supportSetSinkId: false }) as any,
      });
      test.on(OutputTest.Events.Error, err => reject(err));
    }));
  });
});
