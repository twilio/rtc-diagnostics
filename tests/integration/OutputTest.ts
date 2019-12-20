/* tslint:disable only-arrow-functions */

import * as assert from 'assert';

import {
  INCOMING_SOUND_URL,
} from '../../lib/constants';

import {
  OutputTest,
  testOutputDevice,
} from '../../lib/OutputTest';

const defaultTestDuration = 100;
const defaultTestPollIntervalMs = 10;

describe('testOutputDevice', function() {
  describe('when not given a testURI', function() {
    describe('when allowed to time out', function() {
      let outputTestReport: OutputTest.Report;
      const outputTestEvents: OutputTest.Events[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          const test = testOutputDevice(undefined, {
            duration: defaultTestDuration,
            pollIntervalMs: defaultTestPollIntervalMs,
          });
          test.on(OutputTest.Events.Volume, () => {
            outputTestEvents.push(OutputTest.Events.Volume);
          });
          test.on(OutputTest.Events.Error, () => {
            outputTestEvents.push(OutputTest.Events.Error);
          });
          test.on(OutputTest.Events.End, (_, report) => {
            outputTestEvents.push(OutputTest.Events.End);
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
          OutputTest.Events.End,
        );
      });
    });

    describe('when stopped with `didPass` set to `true`', function() {
      let outputTestReport: OutputTest.Report;
      const outputTestEvents: OutputTest.Events[] = [];

      before(async function() {
        outputTestReport = await new Promise(resolve => {
          const test = testOutputDevice(undefined, {
            duration: Infinity,
            pollIntervalMs: defaultTestPollIntervalMs,
          });
          test.on(OutputTest.Events.Volume, () => {
            outputTestEvents.push(OutputTest.Events.Volume);
          });
          test.on(OutputTest.Events.End, (_, report) => {
            outputTestEvents.push(OutputTest.Events.End);
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

  describe('when stopped with `didPass` set to `false`', function() {
    let outputTestReport: OutputTest.Report;
    const outputTestEvents: OutputTest.Events[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
        });
        test.on(OutputTest.Events.Volume, () => {
          outputTestEvents.push(OutputTest.Events.Volume);
        });
        test.on(OutputTest.Events.End, (_, report) => {
          outputTestEvents.push(OutputTest.Events.End);
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
    let outputTestReport: OutputTest.Report;
    const outputTestEvents: OutputTest.Events[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
          testURI: INCOMING_SOUND_URL,
        });
        test.on(OutputTest.Events.Volume, () => {
          outputTestEvents.push(OutputTest.Events.Volume);
        });
        test.on(OutputTest.Events.End, (_, report) => {
          outputTestEvents.push(OutputTest.Events.End);
          setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
        });
        test.on(OutputTest.Events.Error, () => {
          outputTestEvents.push(OutputTest.Events.Error);
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
    let outputTestReport: OutputTest.Report;
    const outputTestEvents: OutputTest.Events[] = [];

    before(async function() {
      outputTestReport = await new Promise(resolve => {
        const test = testOutputDevice(undefined, {
          duration: Infinity,
          pollIntervalMs: defaultTestPollIntervalMs,
          testURI: 'https://media.twiliocdn.com/sdk/js/client/sounds/releases/1.0.0/doesnotactuallyexist.ogg',
        });
        test.on(OutputTest.Events.Volume, () => {
          outputTestEvents.push(OutputTest.Events.Volume);
        });
        test.on(OutputTest.Events.End, (_, report) => {
          outputTestEvents.push(OutputTest.Events.End);
          setTimeout(() => resolve(report), defaultTestPollIntervalMs * 3);
        });
        test.on(OutputTest.Events.Error, () => {
          outputTestEvents.push(OutputTest.Events.Error);
        });
        setTimeout(() => test.stop(false), defaultTestDuration);
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
