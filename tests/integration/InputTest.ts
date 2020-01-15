/* tslint:disable only-arrow-functions */

import * as assert from 'assert';

import {
  InputTest,
  testInputDevice,
} from '../../lib/InputTest';

const testTimeout = 10000;
const defaultTestDuration = 5000;
const defaultTestPollIntervalMs = 50;

describe('testInputDevice', function() {
  describe('when given a MediaStream', function() {
    let mediaStream: MediaStream;
    let vol: GainNode;

    before(function() {
      const context = new AudioContext();

      const streamDestination = context.createMediaStreamDestination();
      const oscillator = context.createOscillator();
      vol = context.createGain();

      oscillator.connect(vol);
      vol.connect(streamDestination);

      oscillator.start();
      mediaStream = streamDestination.stream;
    });

    describe('allowed to run for full duration', function() {
      describe('when the stream is audible', function() {
        let didPass: boolean;
        let report: InputTest.Report;

        before(function(done) {
          this.timeout(testTimeout);
          vol.gain.value = 1;
          testInputDevice(undefined, {
            duration: defaultTestDuration,
            mediaStream,
            pollIntervalMs: defaultTestPollIntervalMs,
          }).on(InputTest.Events.End, (p: boolean, r: InputTest.Report) => {
            didPass = p;
            report = r;
            done();
          });
        });

        it('should return a report with `didPass === true`', function() {
          assert(didPass);
          assert(report.didPass);
        });
      });

      describe('when the stream is silent', function() {
        let didPass: boolean;
        let report: InputTest.Report;

        before(function(done) {
          this.timeout(testTimeout);
          vol.gain.value = 0;
          testInputDevice(undefined, {
            duration: defaultTestDuration,
            mediaStream,
            pollIntervalMs: defaultTestPollIntervalMs,
          }).on(InputTest.Events.End, (p: boolean, r: InputTest.Report) => {
            didPass = p;
            report = r;
            done();
          });
        });

        it('should have all values set to 0', function() {
          assert.equal(report.values.filter(v => v !== 0).length, 0);
        });

        it('should return a report with `didPass === false`', function() {
          assert.equal(didPass, false);
          assert.equal(report.didPass, false);
        });
      });
    });

    describe('stopped manually', function() {
      let events: InputTest.Events[];

      before(async function() {
        const pollIntervalMs = defaultTestPollIntervalMs;

        events = await new Promise(resolve => {
          const e: InputTest.Events[] = [];
          const test = testInputDevice(undefined, {
            duration: Infinity,
            mediaStream,
            pollIntervalMs,
          });
          test.on(InputTest.Events.End, () => {
            e.push(InputTest.Events.End);
            setTimeout(
              () => resolve(e),
              pollIntervalMs * 3,
            );
          });
          test.on(InputTest.Events.Volume, () => {
            e.push(InputTest.Events.Volume);
          });
          setTimeout(
            () => test.stop(),
            pollIntervalMs * 5,
          );
        });
      });

      it('reports some number of volume events', function() {
        assert(events.filter(v => v === InputTest.Events.Volume).length);
      });

      it('no volume events occur after the end event', async function() {
        assert.equal(events[events.length - 1], InputTest.Events.End);
      });
    });
  });
});
