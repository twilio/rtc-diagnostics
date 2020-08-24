/* tslint:disable only-arrow-functions */

import * as assert from 'assert';
import * as sinon from 'sinon';

import {
  testVideoInputDevice,
  VideoInputTest,
} from '../../lib/VideoInputTest';

const defaultTestDuration = 500;

describe('testVideoInputDevice', function() {
  let errorHandler: sinon.SinonSpy;
  let endHandler: sinon.SinonSpy;

  beforeEach(async function() {
    errorHandler = sinon.spy();
    endHandler = sinon.spy();

    await new Promise(resolve => {
      const test = testVideoInputDevice({
        duration: defaultTestDuration,
      });
      test.on(VideoInputTest.Events.Error, errorHandler);
      test.on(VideoInputTest.Events.End, (r) => {
        endHandler(r);
        // we want to wait before resolving so we can detect if the end handler
        // has been called multiple times
        setTimeout(() => resolve(), defaultTestDuration);
      });
    });
  });

  it('should have not called the error handler', function() {
    assert(!errorHandler.called);
  });

  it('should have called the end handler once', function() {
    assert(endHandler.callCount === 1);
  });

  it('should have generated a valid report', function() {
    const report: VideoInputTest.Report = endHandler.args[0][0];
    assert(report);

    assert('deviceId' in report);
    assert('errors' in report);
    assert.equal(report.errors.length, 0);
    assert('testTiming' in report);
    assert('start' in report.testTiming!);
    assert('end' in report.testTiming!);
    assert('testName' in report);
    assert(report.testName === VideoInputTest.testName);
    assert('resolution' in report);
  });

  it('should not contain any errors', function() {
    const report: VideoInputTest.Report = endHandler.args[0][0];
    assert(report);

    assert('errors' in report);
    assert.equal(report.errors.length, 0);
  });
});
