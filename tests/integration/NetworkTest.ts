// tslint:disable only-arrow-functions

import * as assert from 'assert';
import {
  NetworkTest,
  testNetwork,
} from '../../lib/NetworkTest';

import * as twilio from 'twilio';
import { TokenInstance } from 'twilio/lib/rest/api/v2010/account/token';
import * as credentials from '../../credentials.json';

const client = twilio(credentials.accountSid, credentials.authToken);

describe.only('testNetwork', function() {
  describe('when using a list of iceServer credentials', function() {
    let tokens: TokenInstance;

    before(async function() {
      tokens = await client.tokens.create();
    });
  });

  describe('when not given any iceServers', function() {
    let report: NetworkTest.Report;

    before(async function() {
      report = await testNetwork();
    });

    it('should pass', function() {
      assert(report.didPass);
    });

    it('should not have reported any errors', function() {
      assert.equal(report.errors.length, 0);
    });

    it('should have a start and end timestamp', function() {
      assert(report.startTime);
      assert(report.endTime);
      assert(report.endTime > report.startTime);
    });
  });
});
