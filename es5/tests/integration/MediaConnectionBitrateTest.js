"use strict";
/* tslint:disable only-arrow-functions */
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var request = require("request");
var sinon = require("sinon");
var MediaConnectionBitrateTest_1 = require("../../lib/MediaConnectionBitrateTest");
var defaultTestDuration = 500;
var creds = {
    accountSid: window.__env__.ACCOUNTSID,
    authToken: window.__env__.AUTHTOKEN,
};
if (!creds.accountSid || !creds.authToken) {
    throw new Error('Missing credentials. Please use credentials.json or environment variables ACCOUNTSID and AUTHTOKEN.');
}
function getTurnCreds() {
    return new Promise(function (resolve) {
        request.post("https://api.twilio.com/2010-04-01/Accounts/" + creds.accountSid + "/Tokens.json", {
            auth: {
                pass: creds.authToken,
                user: creds.accountSid,
            },
        }, function (e, r, body) { return resolve(JSON.parse(body)); });
    });
}
describe('testMediaConnectionBitrate', function () {
    this.timeout(10000);
    var errorHandler;
    var endHandler;
    beforeEach(function (done) {
        errorHandler = sinon.spy();
        endHandler = sinon.spy();
        getTurnCreds().then(function (res) {
            var iceServers = res.ice_servers;
            var test = MediaConnectionBitrateTest_1.testMediaConnectionBitrate({ iceServers: iceServers });
            setTimeout(function () { test.stop(); });
            test.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, errorHandler);
            test.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (r) {
                endHandler(r);
                setTimeout(function () { return done(); }, defaultTestDuration);
            });
        });
    });
    it('should have not called the error handler', function () {
        assert(!errorHandler.called);
    });
    it('should have called the end handler once', function () {
        assert.equal(endHandler.callCount, 1);
    });
    it('should have generated a valid report', function () {
        var report = endHandler.args[0][0];
        assert(report);
        assert('averageBitrate' in report);
        assert('errors' in report);
        assert.equal(report.errors.length, 0);
        assert('iceCandidateStats' in report);
        assert('start' in report.testTiming);
        assert('end' in report.testTiming);
        assert('testName' in report);
        assert(report.testName === MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.testName);
        assert('values' in report);
    });
    it('should not contain any errors', function () {
        var report = endHandler.args[0][0];
        assert(report);
        assert('errors' in report);
        assert.equal(report.errors.length, 0);
    });
});
//# sourceMappingURL=MediaConnectionBitrateTest.js.map