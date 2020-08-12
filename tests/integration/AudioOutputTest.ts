/* tslint:disable only-arrow-functions */

import * as assert from 'assert';

import {
  AudioOutputTest,
  testAudioOutputDevice,
} from '../../lib/AudioOutputTest';
import {
  INCOMING_SOUND_URL,
} from '../../lib/constants';

const suiteTimeout = 10000;
const defaultTestDuration = 5000;
const defaultTestVolumeEventIntervalMs = 10;

describe('testAudioOutputDevice', function() {
  this.timeout(suiteTimeout);
  describe('when not given a testURI', function() {
    describe('when allowed to time out', function() {
      let audioOutputTestReport: AudioOutputTest.Report;
      const audioOutputTestEvents: AudioOutputTest.Events[] = [];

      before(async function() {
        audioOutputTestReport = await new Promise(resolve => {
          const test = testAudioOutputDevice({
            duration: defaultTestDuration,
            volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
          });
          test.on(AudioOutputTest.Events.Volume, () => {
            audioOutputTestEvents.push(AudioOutputTest.Events.Volume);
          });
          test.on(AudioOutputTest.Events.Error, () => {
            audioOutputTestEvents.push(AudioOutputTest.Events.Error);
          });
          test.on(AudioOutputTest.Events.End, (report) => {
            audioOutputTestEvents.push(AudioOutputTest.Events.End);
            setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
          });
        });
      });

      it('should end with an `end` event', function() {
        assert.equal(
          audioOutputTestEvents[audioOutputTestEvents.length - 1],
          AudioOutputTest.Events.End,
        );
      });
    });

    describe('when stopped', function() {
      let audioOutputTestReport: AudioOutputTest.Report;
      const audioOutputTestEvents: AudioOutputTest.Events[] = [];

      before(async function() {
        audioOutputTestReport = await new Promise(resolve => {
          let timeoutId: any;
          const test = testAudioOutputDevice({
            duration: Infinity,
            volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
          });
          test.on(AudioOutputTest.Events.Volume, () => {
            audioOutputTestEvents.push(AudioOutputTest.Events.Volume);
          });
          test.on(AudioOutputTest.Events.End, (report) => {
            audioOutputTestEvents.push(AudioOutputTest.Events.End);
            clearTimeout(timeoutId);
            setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
          });
          timeoutId = setTimeout(() => test.stop(), defaultTestDuration);
        });
      });

      it('should have some amount of `volume` events', function() {
        assert(
          audioOutputTestEvents.filter(e => e === AudioOutputTest.Events.Volume).length
            > 0,
        );
      });

      it('should end with an `end` event', function() {
        assert.equal(
          audioOutputTestEvents[audioOutputTestEvents.length - 1],
          AudioOutputTest.Events.End,
        );
      });

      it('should not have more than 1 `end` event', function() {
        assert.equal(
          audioOutputTestEvents.filter(e => e === AudioOutputTest.Events.End).length,
          1,
        );
      });
    });
  });

  describe('when given a valid `testURI`', function() {
    let audioOutputTestReport: AudioOutputTest.Report;
    const audioOutputTestEvents: AudioOutputTest.Events[] = [];

    before(async function() {
      audioOutputTestReport = await new Promise(resolve => {
        let timeoutId: any;
        const test = testAudioOutputDevice({
          duration: Infinity,
          testURI: INCOMING_SOUND_URL,
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(AudioOutputTest.Events.Volume, () => {
          audioOutputTestEvents.push(AudioOutputTest.Events.Volume);
        });
        test.on(AudioOutputTest.Events.End, (report) => {
          audioOutputTestEvents.push(AudioOutputTest.Events.End);
          clearTimeout(timeoutId);
          setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
        });
        test.on(AudioOutputTest.Events.Error, () => {
          audioOutputTestEvents.push(AudioOutputTest.Events.Error);
        });
        timeoutId = setTimeout(() => test.stop(), defaultTestDuration);
      });
    });

    it('should not have any errors', function() {
      assert.equal(audioOutputTestReport.errors.length, 0);
    });
  });

  describe('when given an invalid `testURI`', function() {
    let audioOutputTestReport: AudioOutputTest.Report;
    const audioOutputTestEvents: AudioOutputTest.Events[] = [];

    before(async function() {
      audioOutputTestReport = await new Promise(resolve => {
        const test = testAudioOutputDevice({
          duration: Infinity,
          testURI: '',
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(AudioOutputTest.Events.Volume, () => {
          audioOutputTestEvents.push(AudioOutputTest.Events.Volume);
        });
        test.on(AudioOutputTest.Events.End, (report) => {
          audioOutputTestEvents.push(AudioOutputTest.Events.End);
          setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
        });
        test.on(AudioOutputTest.Events.Error, () => {
          audioOutputTestEvents.push(AudioOutputTest.Events.Error);
        });
      });
    });

    it('should not have a "no supported source was found" error', function() {
      assert.equal(audioOutputTestReport.errors.length, 1);
      const error = audioOutputTestReport.errors[0].domError;
      assert(error);
      assert.equal(error!.name, 'NotSupportedError');
    });
  });
});
