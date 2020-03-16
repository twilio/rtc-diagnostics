/* tslint:disable only-arrow-functions */

import * as assert from 'assert';
import * as sinon from 'sinon';

import {
  InputTest,
  testInputDevice,
} from '../../lib/InputTest';

const defaultTestDuration = 500;
const defaultTestPollIntervalMs = 5;

describe('testInputDevice', function() {
  describe('with a deviceId', function() {
    let volumeHandler: sinon.SinonSpy;
    let errorHandler: sinon.SinonSpy;
    let endHandler: sinon.SinonSpy;

    beforeEach(async function() {
      volumeHandler = sinon.spy();
      errorHandler = sinon.spy();
      endHandler = sinon.spy();

      await new Promise(resolve => {
        const test = testInputDevice({
          debug: false,
          duration: defaultTestDuration,
          pollIntervalMs: defaultTestPollIntervalMs,
        });
        test.on(InputTest.Events.Error, errorHandler);
        test.on(InputTest.Events.Volume, volumeHandler);
        test.on(InputTest.Events.End, (r) => {
          endHandler(r);
          // we want to wait before resolving so we can detect if the end handler
          // has been called multiple times
          setTimeout(() => resolve(), defaultTestPollIntervalMs * 3);
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
      const report: InputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('deviceId' in report);
      assert('errors' in report);
      assert.equal(report.errors.length, 0);
      assert('testTiming' in report);
      assert('start' in report.testTiming!);
      assert('end' in report.testTiming!);
      assert('didPass' in report);
      assert('testName' in report);
      assert(report.testName === InputTest.testName);
      assert('values' in report);
    });

    it('should contain the same amount of volume values as there were volume events', function() {
      const report: InputTest.Report = endHandler.args[0][0];
      assert(report);

      assert.equal(report.values.length, volumeHandler.callCount);
    });

    it('should not contain any errors', function() {
      const report: InputTest.Report = endHandler.args[0][0];
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
        const test = testInputDevice({
          debug: false,
          duration: defaultTestDuration,
          pollIntervalMs: defaultTestPollIntervalMs,
        });
        test.on(InputTest.Events.Error, errorHandler);
        test.on(InputTest.Events.Volume, volumeHandler);
        test.on(InputTest.Events.End, (r) => {
          endHandler(r);
          // we want to wait before resolving so we can detect if the end handler
          // has been called multiple times
          setTimeout(() => resolve(), defaultTestPollIntervalMs * 3);
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
      const report: InputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('deviceId' in report);
      assert('errors' in report);
      assert.equal(report.errors.length, 0);
      assert('testTiming' in report);
      assert('start' in report.testTiming!);
      assert('end' in report.testTiming!);
      assert('didPass' in report);
      assert('testName' in report);
      assert(report.testName === InputTest.testName);
      assert('values' in report);
    });

    it('should contain the same amount of volume values as there were volume events', function() {
      const report: InputTest.Report = endHandler.args[0][0];
      assert(report);

      assert.equal(report.values.length, volumeHandler.callCount);
    });

    it('should not contain any errors', function() {
      const report: InputTest.Report = endHandler.args[0][0];
      assert(report);

      assert('errors' in report);
      assert.equal(report.errors.length, 0);
    });

    afterEach(function() {
      sinon.restore();
    });
  });
});
