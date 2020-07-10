// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';

import { waitForPromise } from '../../../lib/utils';

describe('waitForPromise', function() {
  let clock: sinon.SinonFakeTimers;

  before(function() {
    clock = sinon.useFakeTimers();
  });

  after(function() {
    sinon.restore();
  });

  it('should reject if the promise times out', async function() {
    const rejectHandler = sinon.stub();
    const resolveHandler = sinon.stub();

    waitForPromise(new Promise(() => {
      // do nothing
    }), 1).then(resolveHandler).catch(rejectHandler);

    await clock.runAllAsync();

    assert(rejectHandler.calledOnce);
    assert(resolveHandler.notCalled);
  });
  it('should reject if the promise resolves after time out', async function() {
    const rejectHandler = sinon.stub();
    const resolveHandler = sinon.stub();

    waitForPromise(new Promise(resolve => {
      setTimeout(() => { resolve(); }, 2);
    }), 1).then(resolveHandler).catch(rejectHandler);

    await clock.runAllAsync();

    assert(rejectHandler.calledOnce);
    assert(resolveHandler.notCalled);
  });
  it('should reject if the promise rejects', async function() {
    const rejectHandler = sinon.stub();
    const resolveHandler = sinon.stub();

    waitForPromise(Promise.reject(), 1).then(resolveHandler).catch(rejectHandler);

    await clock.runAllAsync();

    assert(rejectHandler.calledOnce);
    assert(resolveHandler.notCalled);
  });
  it('should resolve if the promise resolves before time out', async function() {
    const rejectHandler = sinon.stub();
    const resolveHandler = sinon.stub();

    waitForPromise(new Promise(resolve => {
      setTimeout(() => resolve(), 1);
    }), 2).then(resolveHandler).catch(rejectHandler);

    await clock.runAllAsync();

    assert(resolveHandler.calledOnce);
    assert(rejectHandler.notCalled);
  });
});
