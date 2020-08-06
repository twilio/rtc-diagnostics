/* tslint:disable only-arrow-functions */

import * as assert from 'assert';

import {
  INCOMING_SOUND_URL,
} from '../../lib/constants';
import {
  OutputTest,
  testOutputDevice,
} from '../../lib/OutputTest';

const suiteTimeout = 10000;
const defaultTestDuration = 5000;
const defaultTestVolumeEventIntervalMs = 10;

describe('testOutputDevice', function() {
  this.timeout(suiteTimeout);
  describe('when not given a testURI', function() {
    describe('when allowed to time out', function() {
      let outputTestReport: OutputTest.Report;
      const outputTestEvents: OutputTest.Events[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          const test = testOutputDevice({
            duration: defaultTestDuration,
            volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
          });
          test.on(OutputTest.Events.Volume, () => {
            outputTestEvents.push(OutputTest.Events.Volume);
          });
          test.on(OutputTest.Events.Error, () => {
            outputTestEvents.push(OutputTest.Events.Error);
          });
          test.on(OutputTest.Events.End, (report) => {
            outputTestEvents.push(OutputTest.Events.End);
            setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
          });
        });
      });

      it('should end with an `end` event', function() {
        assert.equal(
          outputTestEvents[outputTestEvents.length - 1],
          OutputTest.Events.End,
        );
      });
    });

    describe('when stopped', function() {
      let outputTestReport: OutputTest.Report;
      const outputTestEvents: OutputTest.Events[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          let timeoutId: any;
          const test = testOutputDevice({
            duration: Infinity,
            volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
          });
          test.on(OutputTest.Events.Volume, () => {
            outputTestEvents.push(OutputTest.Events.Volume);
          });
          test.on(OutputTest.Events.End, (report) => {
            outputTestEvents.push(OutputTest.Events.End);
            clearTimeout(timeoutId);
            setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
          });
          timeoutId = setTimeout(() => test.stop(), defaultTestDuration);
        });
      });

      it('should have some amount of `volume` events', function() {
        assert(
          outputTestEvents.filter(e => e === OutputTest.Events.Volume).length
            > 0,
        );
      });

      it('should end with an `end` event', function() {
        assert.equal(
          outputTestEvents[outputTestEvents.length - 1],
          OutputTest.Events.End,
        );
      });

      it('should not have more than 1 `end` event', function() {
        assert.equal(
          outputTestEvents.filter(e => e === OutputTest.Events.End).length,
          1,
        );
      });
    });
  });

  describe('when given a valid `testURI`', function() {
    let outputTestReport: OutputTest.Report;
    const outputTestEvents: OutputTest.Events[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        let timeoutId: any;
        const test = testOutputDevice({
          duration: Infinity,
          testURI: INCOMING_SOUND_URL,
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(OutputTest.Events.Volume, () => {
          outputTestEvents.push(OutputTest.Events.Volume);
        });
        test.on(OutputTest.Events.End, (report) => {
          outputTestEvents.push(OutputTest.Events.End);
          clearTimeout(timeoutId);
          setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
        });
        test.on(OutputTest.Events.Error, () => {
          outputTestEvents.push(OutputTest.Events.Error);
        });
        timeoutId = setTimeout(() => test.stop(), defaultTestDuration);
      });
    });

    it('should not have any errors', function() {
      assert.equal(outputTestReport.errors.length, 0);
    });
  });

  describe('when given an invalid `testURI`', function() {
    let outputTestReport: OutputTest.Report;
    const outputTestEvents: OutputTest.Events[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice({
          duration: Infinity,
          testURI: '',
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(OutputTest.Events.Volume, () => {
          outputTestEvents.push(OutputTest.Events.Volume);
        });
        test.on(OutputTest.Events.End, (report) => {
          outputTestEvents.push(OutputTest.Events.End);
          setTimeout(() => resolve(report), defaultTestVolumeEventIntervalMs * 3);
        });
        test.on(OutputTest.Events.Error, () => {
          outputTestEvents.push(OutputTest.Events.Error);
        });
      });
    });

    it('should not have a "no supported source was found" error', function() {
      assert.equal(outputTestReport.errors.length, 1);
      const error = outputTestReport.errors[0].domError;
      assert(error);
      assert.equal(error!.name, 'NotSupportedError');
    });
  });
});
