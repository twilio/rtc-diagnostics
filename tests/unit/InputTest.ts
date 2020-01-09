// tslint:disable only-arrow-functions

import * as assert from 'assert';
import {
  InputTest,
  testInputDevice,
} from '../../lib/InputTest';
import { MockAudioContext } from '../mocks/MockAudioContext';
import { mockGetUserMedia } from '../mocks/mockGetUserMedia';

const defaultDuration = 100;
const defaultPollIntervalMs = 10;

describe('testInputDevice', function() {
  describe('when the volume values are all 100', function() {
    let report: InputTest.Report;

    before(async function() {
      report = await new Promise(resolve => {
        testInputDevice(undefined, {
          audioContext: new MockAudioContext({
            analyserNodeOptions: { volumeValues: 100 },
          }) as any,
          duration: defaultDuration,
          getUserMedia: mockGetUserMedia as any,
          pollIntervalMs: defaultPollIntervalMs,
        }).on(InputTest.Events.End, (_, r) => resolve(r));
      });
    });

    it('should have passed', function() {
      assert(report.didPass);
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
});
