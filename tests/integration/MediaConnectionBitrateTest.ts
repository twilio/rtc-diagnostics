/* tslint:disable only-arrow-functions */

import * as assert from 'assert';
import * as request from 'request';
import * as sinon from 'sinon';

import {
  MediaConnectionBitrateTest,
  testMediaConnectionBitrate,
} from '../../lib/MediaConnectionBitrateTest';

const defaultTestDuration = 500;

let creds: any;
if (process.env.ACCOUNTSID && process.env.AUTHTOKEN) {
  creds = {
    accountSid: process.env.ACCOUNTSID,
    authToken: process.env.AUTHTOKEN,
  };
} else {
  creds = require('../../credentials.json');
}

function getTurnCreds() {
  return new Promise(resolve => {
    request.post(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Tokens.json`, {
      auth: {
        pass: creds.authToken,
        user: creds.accountSid,
      },
    }, (e, r, body) => resolve(JSON.parse(body)));
  });
}

describe('testMediaConnectionBitrate', function() {
  this.timeout(10000);
  let errorHandler: sinon.SinonSpy;
  let endHandler: sinon.SinonSpy;

  beforeEach(function(done: any) {
    errorHandler = sinon.spy();
    endHandler = sinon.spy();

    getTurnCreds().then(function(res: any) {
      const iceServers = res.ice_servers;
      const test = testMediaConnectionBitrate({ iceServers });
      setTimeout(() => { test.stop(); });
      test.on(MediaConnectionBitrateTest.Events.Error, errorHandler);
      test.on(MediaConnectionBitrateTest.Events.End, r => {
        endHandler(r);
        setTimeout(() => done(), defaultTestDuration);
      });
    });
  });

  it('should have not called the error handler', function() {
    assert(!errorHandler.called);
  });

  it('should have called the end handler once', function() {
    assert.equal(endHandler.callCount, 1);
  });

  it('should have generated a valid report', function() {
    const report: MediaConnectionBitrateTest.Report = endHandler.args[0][0];
    assert(report);

    assert('averageBitrate' in report);
    assert('errors' in report);
    assert.equal(report.errors.length, 0);
    assert('iceCandidateStats' in report);
    assert('start' in report.testTiming!);
    assert('end' in report.testTiming!);
    assert('testName' in report);
    assert(report.testName === MediaConnectionBitrateTest.testName);
    assert('values' in report);
  });

  it('should not contain any errors', function() {
    const report: MediaConnectionBitrateTest.Report = endHandler.args[0][0];
    assert(report);

    assert('errors' in report);
    assert.equal(report.errors.length, 0);
  });
});
