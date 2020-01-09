// tslint:disable only-arrow-functions

import * as assert from 'assert';
import {
  OutputTest,
  testOutputDevice,
} from '../../lib/OutputTest';
import { AudioElement } from '../../lib/types';
import { MockAudioContext } from '../mocks/MockAudioContext';
import { MockAudioElement } from '../mocks/MockAudioElement';

const defaultDuration = 5;
const defaultPollIntervalMs = 1;

describe('testOutputDevice', function() {
  const audioElementFactory: (new () => AudioElement) = MockAudioElement as any;

  const volumeValues = 100;
  describe(`with volume values of ${volumeValues}`, function() {
    let report: OutputTest.Report;

    before(async function() {
      const audioContext: AudioContext = new MockAudioContext({
        analyserNodeOptions: { volumeValues },
      }) as any;

      report = await new Promise(resolve => {
        testOutputDevice(undefined, {
          audioContext,
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
      const audioContext: AudioContext = new MockAudioContext({
        analyserNodeOptions: { volumeValues: 0 },
      }) as any;

      report = await new Promise(resolve => {
        testOutputDevice(undefined, {
          audioContext,
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

  it('should throw if stopped twice', async function() {
    const test = testOutputDevice(undefined, {
      audioContext: new MockAudioContext({
        analyserNodeOptions: { volumeValues: 100 },
      }) as any,
      audioElementFactory,
    });
    await test.stop(false);
    await assert.rejects(() => test.stop(false));
  });

  it('should report an error if the audio context throws', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testOutputDevice(undefined, {
        audioContext: new MockAudioContext({
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

  it('should allow `setSinkId`', async function() {
    const report = new Promise(resolve => {
      const test = testOutputDevice('foobar', {
        audioContext: new MockAudioContext() as any,
        audioElementFactory,
        duration: defaultDuration,
        pollIntervalMs: defaultPollIntervalMs,
      });
      test.on(OutputTest.Events.End, r => resolve(r));
      test.stop(true);
    });
    assert(report);
  });
});
