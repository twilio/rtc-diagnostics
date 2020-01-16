// tslint:disable only-arrow-functions

import * as assert from 'assert';
import {
  InputTest,
  testInputDevice,
} from '../../lib/InputTest';
import { MockAudioContext } from '../mocks/MockAudioContext';
import { mockGetUserMedia } from '../mocks/mockGetUserMedia';
import { MockMediaStream } from '../mocks/MockMediaStream';
import { MockTrack } from '../mocks/MockTrack';

const defaultDuration = 100;
const defaultPollIntervalMs = 10;

describe('testInputDevice', function() {
  describe('when the volume values are all 100', function() {
    let report: InputTest.Report;
    let test: InputTest;

    before(async function() {
      report = await new Promise(resolve => {
        test = testInputDevice(undefined, {
          audioContext: new MockAudioContext({
            analyserNodeOptions: { volumeValues: 100 },
          }) as any,
          duration: defaultDuration,
          getUserMedia: mockGetUserMedia as any,
          pollIntervalMs: defaultPollIntervalMs,
        });
        test.on(InputTest.Events.End, (_, r) => resolve(r));
      });
    });

    it('should have passed', function() {
      assert(report.didPass);
    });

    it('should return a max volume value of 100', function() {
      assert.equal(test.maxVolume, 100);
    });
  });

  describe('when the volume values are all 0', function() {
    let report: InputTest.Report;

    before(async function() {
      report = await new Promise(resolve => {
        testInputDevice(undefined, {
          audioContext: new MockAudioContext({
            analyserNodeOptions: { volumeValues: 0 },
          }) as any,
          duration: defaultDuration,
          getUserMedia: mockGetUserMedia as any,
          pollIntervalMs: defaultPollIntervalMs,
        }).on(InputTest.Events.End, (_, r) => resolve(r));
      });
    });

    it('should have not passed', function() {
      assert.equal(report.didPass, false);
    });
  });

  it('should work with a MockMediaStream', async function() {
    const report = new Promise(resolve => {
      const test = testInputDevice(undefined, {
        audioContext: new MockAudioContext() as any,
        mediaStream: new MockMediaStream({
          tracks: [new MockTrack(), new MockTrack()],
        }) as any,
      });
      test.on(InputTest.Events.End, (_, r) => resolve(r));
    });
    assert(report);
  });

  it('should throw an error if AudioContext is not supported', function() {
    assert.throws(() => testInputDevice());
  });

  it('should throw an error if stopped multiple times', function() {
    const test = testInputDevice(undefined, {
      audioContext: new MockAudioContext({
        analyserNodeOptions: { volumeValues: 100 },
      }) as any,
      getUserMedia: mockGetUserMedia as any,
    });
    test.stop();
    assert.throws(() => test.stop());
  });

  it('should report errors if the audio context throws', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testInputDevice(undefined, {
        audioContext: new MockAudioContext({
          analyserNodeOptions: { volumeValues: 100 },
          doThrow: { createAnalyser: true },
        }) as any,
        duration: defaultDuration,
        getUserMedia: mockGetUserMedia as any,
        pollIntervalMs: defaultPollIntervalMs,
      });
      test.on(InputTest.Events.Error, e => reject(e));
    }));
  });
});
