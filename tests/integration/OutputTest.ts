/* tslint:disable only-arrow-functions */

import * as assert from 'assert';

import {
  INCOMING_SOUND_URL,
} from '../../lib/constants';

import {
  OutputTestEvents,
  OutputTestReport,
  testOutputDevice,
} from '../../lib/OutputTest';

const defaultTestDuration = 100;
const defaultTestPollIntervalMs = 10;

describe('testOutputDevice', function() {
  describe('when not given a testURI', function() {
    describe('when allowed to time out', function() {
      let outputTestReport: OutputTestReport;
      const outputTestEvents: OutputTestEvents[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          const test = testOutputDevice(undefined, {
            duration: defaultTestDuration,
            pollIntervalMs: defaultTestPollIntervalMs,
          });
          test.on(OutputTestEvents.Volume, () => {
            outputTestEvents.push(OutputTestEvents.Volume);
          });
          test.on(OutputTestEvents.Error, () => {
            outputTestEvents.push(OutputTestEvents.Error);
          });
          test.on(OutputTestEvents.End, report => {
            outputTestEvents.push(OutputTestEvents.End);
            setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
          });
        });
      });

      it('should have failed', function() {
        assert.equal(outputTestReport.didPass, false);
      });

      it('should end with an `end` event', function() {
        assert.equal(
          outputTestEvents[outputTestEvents.length - 1],
          OutputTestEvents.End,
        );
      });
    });

    describe('when stopped with `didPass` set to `true`', function() {
      let outputTestReport: OutputTestReport;
      const outputTestEvents: OutputTestEvents[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          const test = testOutputDevice(undefined, {
            duration: Infinity,
            pollIntervalMs: defaultTestPollIntervalMs,
          });
          test.on(OutputTestEvents.Volume, () => {
            outputTestEvents.push(OutputTestEvents.Volume);
          });
          test.on(OutputTestEvents.End, report => {
            outputTestEvents.push(OutputTestEvents.End);
            setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
          });
          setTimeout(() => test.stop(true), defaultTestDuration);
        });
      });

      it('should pass', function() {
        assert(outputTestReport.didPass);
      });

      it('should have some amount of `volume` events', function() {
        assert(
          outputTestEvents.filter(e => e === OutputTestEvents.Volume).length
            > 0,
        );
      });

      it('should end with an `end` event', function() {
        assert.equal(
          outputTestEvents[outputTestEvents.length - 1],
          OutputTestEvents.End,
        );
      });

      it('should not have more than 1 `end` event', function() {
        assert.equal(
          outputTestEvents.filter(e => e === OutputTestEvents.End).length,
          1,
        );
      });
    });
  });

  describe('when stopped with `didPass` set to `false`', function() {
    let outputTestReport: OutputTestReport;
    const outputTestEvents: OutputTestEvents[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
        });
        test.on(OutputTestEvents.Volume, () => {
          outputTestEvents.push(OutputTestEvents.Volume);
        });
        test.on(OutputTestEvents.End, report => {
          outputTestEvents.push(OutputTestEvents.End);
          setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
        });
        setTimeout(() => test.stop(false), defaultTestDuration);
      });
    });

    it('should not pass', function() {
      assert.equal(outputTestReport.didPass, false);
    });
  });

  describe('when given a valid `testURI`', function() {
    let outputTestReport: OutputTestReport;
    const outputTestEvents: OutputTestEvents[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
          testURI: INCOMING_SOUND_URL,
        });
        test.on(OutputTestEvents.Volume, () => {
          outputTestEvents.push(OutputTestEvents.Volume);
        });
        test.on(OutputTestEvents.End, report => {
          outputTestEvents.push(OutputTestEvents.End);
          setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
        });
        test.on(OutputTestEvents.Error, () => {
          outputTestEvents.push(OutputTestEvents.Error);
        });
        setTimeout(() => test.stop(true), defaultTestDuration);
      });
    });

    it('should not have any errors', function() {
      assert.equal(outputTestReport.errors.length, 0);
    });

    it('should load the audio and pass', function() {
      assert(outputTestReport.didPass);
    });
  });

  describe('when given an invalid `testURI`', function() {
    let outputTestReport: OutputTestReport;
    const outputTestEvents: OutputTestEvents[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
          testURI: 'https://media.twiliocdn.com/sdk/js/client/sounds/releases/1.0.0/doesnotactuallyexist.ogg',
        });
        test.on(OutputTestEvents.Volume, () => {
          outputTestEvents.push(OutputTestEvents.Volume);
        });
        test.on(OutputTestEvents.End, report => {
          outputTestEvents.push(OutputTestEvents.End);
          setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
        });
        test.on(OutputTestEvents.Error, () => {
          outputTestEvents.push(OutputTestEvents.Error);
        });
        setTimeout(() => test.stop(), defaultTestDuration);
      });
    });

    it('should not have a "no supported source was found" error', function() {
      assert.equal(outputTestReport.errors.length, 1);
      const error = outputTestReport.errors[0].error;
      assert(error);
      assert.equal(error!.name, 'NotSupportedError');
    });
  });
});
