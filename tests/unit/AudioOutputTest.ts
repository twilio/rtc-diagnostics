// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';
import {
  AudioOutputTest,
  testAudioOutputDevice,
} from '../../lib/AudioOutputTest';
import { ErrorName } from '../../lib/constants';
import { DiagnosticError } from '../../lib/errors/DiagnosticError';
import { AudioElement } from '../../lib/types';
import { mockAudioContextFactory } from '../mocks/MockAudioContext';
import { mockAudioElementFactory } from '../mocks/MockAudioElement';
import { mockEnumerateDevicesFactory } from '../mocks/mockEnumerateDevices';

const defaultDuration = 100;
const defaultVolumeEventIntervalMs = 1;

describe('testAudioOutputDevice', function() {
  const audioElementFactory: (new () => AudioElement) = mockAudioElementFactory({
    supportSetSinkId: true,
  }) as any;

  const volumeValues = 100;
  describe(`with volume values of ${volumeValues}`, function() {
    let report: AudioOutputTest.Report;

    before(async function() {
      report = await new Promise(resolve => {
        testAudioOutputDevice({
          audioContextFactory: mockAudioContextFactory({
            analyserNodeOptions: { volumeValues },
          }) as any,
          audioElementFactory,
          duration: defaultDuration,
          enumerateDevices: mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
          }),
          volumeEventIntervalMs: defaultVolumeEventIntervalMs,
        }).on(AudioOutputTest.Events.End, (r) => resolve(r));
      });
    });

    it('timestamps should be set', function() {
      assert(report.testTiming);
      assert(report.testTiming.duration);
      assert(report.testTiming.end);
      assert(report.testTiming.start);
    });

    it(`all volume values should be ${volumeValues}`, function() {
      assert(report.values.every(v => v === volumeValues));
    });
  });

  describe('with volume values of 0', function() {
    let report: AudioOutputTest.Report;

    before(async function() {
      const audioContextFactory: typeof AudioContext = mockAudioContextFactory({
        analyserNodeOptions: { volumeValues: 0 },
      }) as any;

      report = await new Promise(resolve => {
        testAudioOutputDevice({
          audioContextFactory,
          audioElementFactory,
          duration: defaultDuration,
          enumerateDevices: mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
          }),
          volumeEventIntervalMs: defaultVolumeEventIntervalMs,
        }).on(AudioOutputTest.Events.End, (r) => resolve(r));
      });
    });

    it('timestamps should be set', function() {
      assert(report.testTiming);
      assert(report.testTiming.duration);
      assert(report.testTiming.end);
      assert(report.testTiming.start);
    });

    it('all volume values should be 0', function() {
      assert(report.values.every(v => v === 0));
    });
  });

  it('should report if stopped normally', async function() {
    const report: AudioOutputTest.Report = await new Promise(resolve => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory({
          analyserNodeOptions: { volumeValues },
        }) as any,
        audioElementFactory,
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
        }),
        volumeEventIntervalMs: defaultVolumeEventIntervalMs,
      });
      test.on(AudioOutputTest.Events.End, resolve);
      setTimeout(() => {
        test.stop();
      }, defaultDuration);
    });
    assert(report);
  });

  it('should report the default device if not passing in a deviceId', async function() {
    const report: AudioOutputTest.Report = await new Promise(resolve => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory,
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [{
            deviceId: 'foo',
            kind: 'audiooutput',
          }, {
            deviceId: 'bar',
            kind: 'audiooutput',
          }] as any,
        }),
      });
      test.on(AudioOutputTest.Events.End, resolve);
      setTimeout(() => {
        test.stop();
      }, defaultDuration);
    });
    assert(report);
    assert.equal(report.deviceId, 'foo');
  });

  it('should report the passed device if passing in a deviceId', async function() {
    const report: AudioOutputTest.Report = await new Promise(resolve => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory,
        deviceId: 'bar',
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [{
            deviceId: 'foo',
            kind: 'audiooutput',
          }, {
            deviceId: 'bar',
            kind: 'audiooutput',
          }] as any,
        }),
      });
      test.on(AudioOutputTest.Events.End, resolve);
      setTimeout(() => {
        test.stop();
      }, defaultDuration);
    });
    assert(report);
    assert.equal(report.deviceId, 'bar');
  });

  describe('should immediately end and report an error', function() {
    // not providing the mock object here results in the test resorting to the
    // global
    // because these are unit tests, and node does not have these globals,
    // they are null and are essentially "not supported"

    it('when AudioContext is not supported', async function() {
      const report: AudioOutputTest.Report = await new Promise(resolve => {
        const test = testAudioOutputDevice({
          audioElementFactory,
          enumerateDevices: mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
          }),
        });
        test.on(AudioOutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(AudioOutputTest.Events.End, (r) => resolve(r));
      });
      assert(report);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, ErrorName.UnsupportedError);
    });
    it('when Audio is not supported', async function() {
      const report: AudioOutputTest.Report = await new Promise(resolve => {
        const test = testAudioOutputDevice({
          audioContextFactory: mockAudioContextFactory() as any,
          enumerateDevices: mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
          }),
        });
        test.on(AudioOutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(AudioOutputTest.Events.End, (r) => resolve(r));
      });
      assert(report);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, ErrorName.UnsupportedError);
    });
    it('when neither AudioContext or Audio is supported', async function() {
      const report: AudioOutputTest.Report = await new Promise(resolve => {
        const test = testAudioOutputDevice({
          enumerateDevices: mockEnumerateDevicesFactory({
            devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
          }),
        });
        test.on(AudioOutputTest.Events.Error, () => {
          // do nothing, prevent rejection
        });
        test.on(AudioOutputTest.Events.End, (r) => resolve(r));
      });
      assert(report);
      assert.equal(report.errors.length, 1);
      const [error] = report.errors;
      assert(error instanceof DiagnosticError);
      assert.equal(error.name, ErrorName.UnsupportedError);
    });
  });

  it('should warn if stopped twice', function() {
    const stub = sinon.stub(console, 'warn');
    const test = testAudioOutputDevice({
      audioContextFactory: mockAudioContextFactory({
        analyserNodeOptions: { volumeValues: 100 },
      }) as any,
      audioElementFactory,
      debug: true,
      enumerateDevices: mockEnumerateDevicesFactory({
        devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
      }),
    });
    test.stop();
    test.stop();
    assert(stub.callCount);
    stub.restore();
  });

  ([
    [new DiagnosticError(), 'DiagnosticError'],
    [new (global as any).DOMError(), 'DOMError'],
    [new (global as any).DOMException(), 'DOMException'],
    [new Error(), 'an unknown error'],
  ] as const).forEach(([error, name]) => {
    describe(`should handle ${name}`, function() {
      let report: AudioOutputTest.Report | undefined;

      beforeEach(async function() {
        report = await new Promise(resolve => {
          const test = testAudioOutputDevice({
            audioContextFactory: mockAudioContextFactory({
              throw: { construction: error },
            }) as any,
            audioElementFactory,
            duration: defaultDuration,
            enumerateDevices: mockEnumerateDevicesFactory({
              devices: [{ deviceId: 'default', kind: 'audiooutput' } as any],
            }),
            volumeEventIntervalMs: defaultVolumeEventIntervalMs,
          });
          test.on(AudioOutputTest.Events.Error, () => { /* no-op */ });
          test.on(AudioOutputTest.Events.End, resolve);
        });
      });

      it('should report an error', function() {
        assert(report);
        assert.equal(report?.errors.length, 1);
      });

      afterEach(function() {
        report = undefined;
      });
    });
  });

  it('should allow `deviceId` if `setSinkId` is supported', async function() {
    const report = await new Promise(resolve => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory({
          analyserNodeOptions: { volumeValues: 100 },
        }) as any,
        audioElementFactory,
        deviceId: 'foobar',
        duration: defaultDuration,
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [{ deviceId: 'foobar', kind: 'audiooutput' } as any],
        }),
        volumeEventIntervalMs: defaultVolumeEventIntervalMs,
      });
      test.on(AudioOutputTest.Events.End, (r) => resolve(r));
      test.stop();
    });
    assert(report);
  });

  it('should not allow `deviceId` if `setSinkId` is unsupported', async function() {
    const test = testAudioOutputDevice({
      audioContextFactory: mockAudioContextFactory() as any,
      audioElementFactory: mockAudioElementFactory({ supportSetSinkId: false }) as any,
      deviceId: 'foobar',
      enumerateDevices: mockEnumerateDevicesFactory({
        devices: [{ deviceId: 'foobar', kind: 'audiooutput' } as any],
      }),
    });

    const results = await Promise.all([
      new Promise(resolve => test.on(AudioOutputTest.Events.Error, resolve)),
      new Promise(resolve => test.on(AudioOutputTest.Events.End, resolve)),
    ]);

    const error = results[0] as DiagnosticError;
    const report = results[1] as AudioOutputTest.Report;

    assert(error);
    assert(report);
  });

  it('should throw during setup when `enumerateDevices` is not supported', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory,
        deviceId: 'foobar',
      });
      test.on(AudioOutputTest.Events.Error, err => reject(err));
    }));
  });

  it('should throw during setup when there are no detected output devices', async function() {
    await assert.rejects(() => new Promise((_, reject) => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory: mockAudioElementFactory() as any,
        deviceId: 'foobar',
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [],
        }),
      });
      test.on(AudioOutputTest.Events.Error, err => reject(err));
    }));
  });

  it('should throw `InvalidOptions` error if passed invalid options', async function() {
    const report: AudioOutputTest.Report = await new Promise(resolve => {
      const test = testAudioOutputDevice({
        audioContextFactory: mockAudioContextFactory() as any,
        audioElementFactory: mockAudioElementFactory() as any,
        deviceId: {} as any, // is invalid because not type `string`
        enumerateDevices: mockEnumerateDevicesFactory({
          devices: [{
            deviceId: 'foobar',
            groupId: 'biffbazz',
            kind: 'audioinput',
            label: 'test-device',
            toJSON: () => 'some-json',
          }],
        }) as any,
      });
      test.on(AudioOutputTest.Events.Error, () => { /* no-op */ });
      test.on(AudioOutputTest.Events.End, resolve);
    });
    assert.equal(report.errors.length, 1);
    assert(report.errors[0] instanceof DiagnosticError);
    assert.equal(report.errors[0].name, ErrorName.InvalidOptionsError);
  });
});
