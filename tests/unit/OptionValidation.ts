// tslint:disable only-arrow-functions

import * as assert from 'assert';
import { DiagnosticError } from '../../lib/errors';
import {
  createAudioDeviceValidator,
  validateOptions,
  validateTime,
} from '../../lib/utils/OptionValidation';
import { mockEnumerateDevicesFactory } from '../mocks/mockEnumerateDevices';

describe('OptionValidation', function() {
  describe('validateTime', function() {
    it('should return an invalidity string if the time is negative', function() {
      const shouldBeString = validateTime(-1);
      assert.equal(typeof shouldBeString, 'string');
    });
    it('should return `undefined` if the time is valid', function() {
      const shouldBeUndefined = validateTime(0);
      assert.equal(typeof shouldBeUndefined, 'undefined');

      const shouldAlsoBeUndefined = validateTime(1);
      assert.equal(typeof shouldAlsoBeUndefined, 'undefined');
    });
  });

  describe('AudioDeviceValidator', function() {
    describe('createAudioDeviceValidator', function() {
      describe('when not given any options', function() {
        let validator: Function;
        before(function() {
          validator = createAudioDeviceValidator();
        });
        it('should return a function', function() {
          assert.equal(typeof validator, 'function');
        });
        it('should throw an `DiagnosticError`', async function() {
          try {
            await validator('foobar');
          } catch (error) {
            assert(error instanceof DiagnosticError);
          }
        });
      });
      describe('when given some options', function() {
        const mockOptions = [{
          deviceId: undefined,
          devices: [],
          expected: 'No audio devices available.',
          title: 'when it returns no devices',
        }, {
          deviceId: undefined,
          devices: [{ deviceId: 'default' }],
          expected: undefined,
          title: 'when it has a default device',
        }, {
          deviceId: undefined,
          devices: [{ deviceId: 'default', kind: 'audioinput' }],
          expected: undefined,
          kind: 'audioinput',
          title: 'when looking for a specific kind that is available',
        }, {
          deviceId: undefined,
          devices: [{ deviceId: 'default', kind: 'audiooutput' }],
          expected: 'Device ID "default" is not the correct "kind",'
            + ` is "audiooutput" but expected "audioinput".`,
          kind: 'audioinput',
          title: 'when looking for a specific kind that is not available',
        }, {
          deviceId: 'foobar',
          devices: [{ deviceId: 'default' }],
          expected: `Device ID "foobar" not found within list of available devices.`,
          title: 'when looking for a id that is not available',
        }];

        mockOptions.forEach(options => {
          describe(options.title, function() {
            let validator: Function;
            before(function() {
              validator = createAudioDeviceValidator({
                enumerateDevices: mockEnumerateDevicesFactory({
                  devices: options.devices as any,
                }),
                kind: options.kind as any,
              });
            });
            it('should return a function', function() {
              assert(typeof validator === 'function');
            });
            it('should return an invalidity string', async function() {
              const reason = await validator(options.deviceId);
              assert.equal(reason, options.expected);
            });
          });
        });
      });
    });
  });

  describe('validateOptions', function() {
    it('should not return anything for valid options', async function() {
      const reasons = await validateOptions({
        someOption: 10,
      }, {
        someOption: validateTime,
      });
      assert.equal(typeof reasons, 'undefined');
    });

    describe('should return invalid reasons for invalid options', function() {
      it('should work for a real validator', async function() {
        const reasons = await validateOptions({
          someOption: -10,
        }, {
          someOption: validateTime,
        });
        assert.equal(typeof reasons, 'object');
      });

      it('should work for a mock async validator', async function() {
        const reasons = await validateOptions({
          someOption: -10,
        }, {
          someOption: async () => 'foobar',
        });
        assert.equal(typeof reasons, 'object');
      });

      it('should work for a mock validator', async function() {
        const reasons = await validateOptions({
          someOption: -10,
        }, {
          someOption: () => 'foobar',
        });
        assert.equal(typeof reasons, 'object');
      });

      it('should handle when a validator throws', async function() {
        const reasons = await validateOptions({
          someOption: -10,
        }, {
          someOption: () => { throw new DiagnosticError(); },
        });
        assert.equal(typeof reasons, 'object');
      });
    });
  });
});
