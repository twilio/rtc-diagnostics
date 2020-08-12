/* tslint:disable only-arrow-functions */

import * as assert from 'assert';
import * as sinon from 'sinon';

import {
  AudioInputTest,
  testAudioInputDevice,
} from '../../lib/AudioInputTest';

const defaultTestDuration = 500;
const defaultTestVolumeEventIntervalMs = 5;

describe('testAudioInputDevice', function() {
  describe('with a deviceId', function() {
    let volumeHandler: sinon.SinonSpy;
    let errorHandler: sinon.SinonSpy;
    let endHandler: sinon.SinonSpy;

    beforeEach(async function() {
      volumeHandler = sinon.spy();
      errorHandler = sinon.spy();
      endHandler = sinon.spy();

      await new Promise(resolve => {
        const test = testAudioInputDevice({
          debug: false,
          duration: defaultTestDuration,
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(AudioInputTest.Events.Error, errorHandler);
        test.on(AudioInputTest.Events.Volume, volumeHandler);
        test.on(AudioInputTest.Events.End, (r) => {
          endHandler(r);
          // we want to wait before resolving so we can detect if the end handler
          // has been called multiple times
          setTimeout(() => resolve(), defaultTestVolumeEventIntervalMs * 3);
        });
      });
    });

    it('should have called the volume handler more than once', function() {
      assert(volumeHandler.callCount > 1);
    });

    it('should have not called the error handler', function() {
      assert(!errorHandler.called);
    });

    it('should have called the end handler once', function() {
      assert(endHandler.callCount === 1);
    });

    it('should have generated a valid report', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('deviceId' in report);
      assert('errors' in report);
      assert.equal(report.errors.length, 0);
      assert('testTiming' in report);
      assert('start' in report.testTiming!);
      assert('end' in report.testTiming!);
      assert('testName' in report);
      assert(report.testName === AudioInputTest.testName);
      assert('values' in report);
    });

    it('should contain the same amount of volume values as there were volume events', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert.equal(report.values.length, volumeHandler.callCount);
    });

    it('should not contain any errors', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('errors' in report);
      assert.equal(report.errors.length, 0);
    });

    afterEach(function() {
      sinon.restore();
    });
  });

  describe('without a deviceId', function() {
    let volumeHandler: sinon.SinonSpy;
    let errorHandler: sinon.SinonSpy;
    let endHandler: sinon.SinonSpy;

    beforeEach(async function() {
      volumeHandler = sinon.spy();
      errorHandler = sinon.spy();
      endHandler = sinon.spy();

      await new Promise(resolve => {
        const test = testAudioInputDevice({
          debug: false,
          duration: defaultTestDuration,
          volumeEventIntervalMs: defaultTestVolumeEventIntervalMs,
        });
        test.on(AudioInputTest.Events.Error, errorHandler);
        test.on(AudioInputTest.Events.Volume, volumeHandler);
        test.on(AudioInputTest.Events.End, (r) => {
          endHandler(r);
          // we want to wait before resolving so we can detect if the end handler
          // has been called multiple times
          setTimeout(() => resolve(), defaultTestVolumeEventIntervalMs * 3);
        });
      });
    });

    it('should have called the volume handler more than once', function() {
      assert(volumeHandler.callCount > 1);
    });

    it('should have not called the error handler', function() {
      assert(!errorHandler.called);
    });

    it('should have called the end handler once', function() {
      assert(endHandler.callCount === 1);
    });

    it('should have generated a valid report', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('deviceId' in report);
      assert('errors' in report);
      assert.equal(report.errors.length, 0);
      assert('testTiming' in report);
      assert('start' in report.testTiming!);
      assert('end' in report.testTiming!);
      assert('testName' in report);
      assert(report.testName === AudioInputTest.testName);
      assert('values' in report);
    });

    it('should contain the same amount of volume values as there were volume events', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert.equal(report.values.length, volumeHandler.callCount);
    });

    it('should not contain any errors', function() {
      const report: AudioInputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('errors' in report);
      assert.equal(report.errors.length, 0);
    });

    afterEach(function() {
      sinon.restore();
    });
  });
});
