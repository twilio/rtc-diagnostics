import * as assert from 'assert';

import { testInputDevice, InputTestReport } from '../../lib/InputTest';

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

    describe('when the stream is audible', function() {
      let report: InputTestReport;

      before(async function() {
        vol.gain.value = 1;
        report = await testInputDevice(undefined, {
          mediaStream,
          ttl: 1000,
        }).start();
      });

      it('should return a report with `didPass === true`', function() {
        assert(report.didPass);
      });
    });

    describe('when the stream is silent', function() {
      let report: InputTestReport;

      before(async function() {
        vol.gain.value = 0;
        report = await testInputDevice(undefined, {
          mediaStream,
          ttl: 1000,
        }).start();
      });

      it('should have all values set to 0', function() {
        assert.equal(report.values.filter(v => v !== 0).length, 0);
      });

      it('should return a report with `didPass === false`', function() {
        assert.equal(report.didPass, false);
      });
    })
  });
});
