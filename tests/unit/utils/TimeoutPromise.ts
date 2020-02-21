// tslint:disable only-arrow-functions

import * as assert from 'assert';

import { waitForPromise } from '../../../lib/utils/TimeoutPromise';

describe('waitForPromise', function() {
  it('should reject if the promise times out', async function() {
    await assert.rejects(() => waitForPromise(new Promise(() => {
      // do nothing
    }), 1));
  });
  it('should reject if the promise resolves after time out', async function() {
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, 3)),
      assert.rejects(() => waitForPromise(new Promise(resolve =>
        setTimeout(resolve, 2)), 1)),
    ]);
  });
  it('should reject if the promise rejects', async function() {
    await assert.rejects(waitForPromise(Promise.reject(), 1));
  });
  it('should resolve if the promise resolves before time out', async function() {
    await waitForPromise(Promise.resolve(), 1);
  });
});
