import * as assert from 'assert';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import { ErrorName, WarningName } from '../../lib/constants';
import { DiagnosticError } from '../../lib/errors/DiagnosticError';
import { MediaConnectionBitrateTest, testMediaConnectionBitrate } from '../../lib/MediaConnectionBitrateTest';

describe('MediaConnectionBitrateTest', () => {
  const root = (global as any);
  const iceServers = [{
    credential: 'bar',
    url: 'turn:global.turn.twilio.com:3478?transport=udp',
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: 'foo',
  }];

  let mediaConnectionBitrateTest: MediaConnectionBitrateTest;
  let originalRTCPeerConnection: any;
  let options: any;
  let pcReceiverContext: any;
  let pcSenderContext: any;
  let rtcDataChannel: any;

  let pcCreationCount = 0;

  const expectEvent = (eventName: string, emitter: EventEmitter) => {
    return new Promise((resolve) => emitter.once(eventName, (res) => resolve(res)));
  };

  const getPeerConnectionFactory = (): any => {
    return function(this: any, rtcConfiguration: RTCConfiguration) {
      this.rtcConfiguration = rtcConfiguration;
      this.close = sinon.stub();
      this.setLocalDescription = sinon.stub();
      this.setRemoteDescription = sinon.stub();
      this.createAnswer = sinon.stub().returns(Promise.resolve());
      this.createOffer = sinon.stub().returns(Promise.resolve());
      this.addIceCandidate = sinon.stub().returns({catch: sinon.stub()});
      this.createDataChannel = sinon.stub().returns(rtcDataChannel);

      // The tests always uses 2 PeerConnections
      // The first one is always the receiver
      // Let's capture them for mocking
      pcCreationCount++;
      if (pcCreationCount % 2 === 1) {
        pcReceiverContext = this;
      } else {
        pcSenderContext = this;
      }
    };
  };

  beforeEach(() => {
    options = {
      getRTCIceCandidateStatsReport: sinon.stub()
        .resolves({
          iceCandidateStats: [],
        }),
      iceServers,
    };

    rtcDataChannel = {
      send: sinon.stub(),
    };

    originalRTCPeerConnection = root.RTCPeerConnection;
    root.RTCPeerConnection = getPeerConnectionFactory();
  });

  afterEach(() => {
    pcReceiverContext = null;
    pcSenderContext = null;
    root.RTCPeerConnection = originalRTCPeerConnection;
    if (mediaConnectionBitrateTest) {
      mediaConnectionBitrateTest.stop();
    }
  });

  describe('testMediaConnectionBitrate', () => {
    it('should return MediaConnectionBitrateTest instance', () => {
      mediaConnectionBitrateTest = testMediaConnectionBitrate(options);
      assert(!!mediaConnectionBitrateTest);
    });
  });

  describe('constructor', () => {
    it('should use iceServers option', () => {
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
      assert.deepEqual(pcReceiverContext.rtcConfiguration.iceServers, iceServers);
      assert.deepEqual(pcSenderContext.rtcConfiguration.iceServers, iceServers);
    });

    it('should use relay on the receiving peer connection', () => {
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
      assert.equal(pcReceiverContext.rtcConfiguration.iceTransportPolicy, 'relay');
    });

    it('should not use relay on the sending peer connection', () => {
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
      assert.equal(pcSenderContext.rtcConfiguration.iceTransportPolicy, undefined);
    });
  });

  describe('onicecandidate', () => {
    const candidateRelay = 'candidate:1 1 udp 22 1.2.3.4 44 typ relay raddr 1.2.3.4 rport 55 generation 0 ufrag UqY3 network-id 2';
    const candidateHost = 'candidate:1 1 tcp 22 1.2.3.4 9 typ host tcptype active generation 0 ufrag ARCY network-id 3';

    let event: any;

    beforeEach(() => {
      event = {
        candidate: {
          candidate: candidateRelay,
        },
      };
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
    });

    context('receiver pc', () => {
      it('should add ICE candidate to remote pc', () => {
        pcReceiverContext.onicecandidate(event);
        sinon.assert.calledWithExactly(pcSenderContext.addIceCandidate, event.candidate);
      });

      it('should not add ICE candidate if candidate event is empty', () => {
        pcReceiverContext.onicecandidate({});
        sinon.assert.notCalled(pcSenderContext.addIceCandidate);
      });

      it('should emit error on addIceCandidate failure', () => {
        pcSenderContext.addIceCandidate = () => ({
          catch: (cb: Function) => {
            cb('foo');
          },
        });

        setTimeout(() => pcReceiverContext.onicecandidate(event));

        return expectEvent('error', mediaConnectionBitrateTest).then((result: any) => {
          assert.equal(result.domError, 'foo');
        });
      });
    });

    context('sender pc', () => {
      it('should add ICE candidate to remote pc', () => {
        pcSenderContext.onicecandidate(event);
        sinon.assert.calledWithExactly(pcReceiverContext.addIceCandidate, event.candidate);
      });

      it('should not add ICE candidate if candidate event is empty', () => {
        pcSenderContext.onicecandidate({});
        sinon.assert.notCalled(pcReceiverContext.addIceCandidate);
      });

      it('should emit error on addIceCandidate failure', () => {
        pcReceiverContext.addIceCandidate = () => ({
          catch: (cb: Function) => {
            cb('foo');
          },
        });

        setTimeout(() => pcSenderContext.onicecandidate(event));

        return expectEvent('error', mediaConnectionBitrateTest).then((result: any) => {
          assert.equal(result.domError, 'foo');
        });
      });
    });
  });

  describe('setup RTCPeerConnections', () => {
    const wait = () => new Promise(r => setTimeout(r, 1));

    beforeEach(() => {
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
      mediaConnectionBitrateTest.stop = sinon.spy(mediaConnectionBitrateTest.stop);
    });

    it('should throw error on createOffer failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcSenderContext.createOffer = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create offer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });

    it('should throw error on sender setLocalDescription failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcSenderContext.setLocalDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });

    it('should throw error on receiver setRemoteDescription failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcReceiverContext.setRemoteDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });

    it('should throw error on createAnswer failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcReceiverContext.createAnswer = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create answer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });

    it('should throw error on receiver setLocalDescription failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcReceiverContext.setLocalDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });

    it('should throw error on sender setRemoteDescription failure', () => {
      const callback = sinon.spy();
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, callback);
      pcSenderContext.setRemoteDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
        sinon.assert.called(mediaConnectionBitrateTest.stop as any);
      });
    });
  });

  describe('setup data channel', () => {
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(0);
      mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
      mediaConnectionBitrateTest.stop = sinon.spy(mediaConnectionBitrateTest.stop);
    });

    afterEach(() => {
      clock.restore();
    });

    it('should emit error on createDataChannel failure', (done) => {
      pcSenderContext.createDataChannel = () => { throw new Error(); };
      mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, (error: DiagnosticError) => {
        assert.equal(error.message, 'Error creating data channel');
        sinon.assert.notCalled(mediaConnectionBitrateTest.stop as any);
        done();
      });
      clock.tick(1);
    });

    describe('when the test times out', () => {
      it('should emit an error and call stop', () => {
        rtcDataChannel.readyState = 'open';

        let errorName: string = '';
        mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, (error: DiagnosticError) => {
          errorName = error.name;
        });

        clock.tick(15100);

        sinon.assert.calledOnce(mediaConnectionBitrateTest.stop as any);
        assert.equal(errorName, ErrorName.DiagnosticError);
      });
    });

    describe('after creating successfully', () => {
      describe('send message', () => {
        beforeEach(() => {
          clock.tick(1);
          rtcDataChannel.readyState = 'open';
        });

        it('should not send data if rtcDataChannel is not open', () => {
          rtcDataChannel.readyState = 'connecting';
          rtcDataChannel.onopen();
          clock.tick(1);

          sinon.assert.notCalled(rtcDataChannel.send);
        });

        it('should not send data if max buffer is reached', () => {
          rtcDataChannel.bufferedAmount = 999999;
          rtcDataChannel.onopen();
          clock.tick(1);

          sinon.assert.notCalled(rtcDataChannel.send);
        });

        it('should send max data allowed', () => {
          rtcDataChannel.onopen();
          clock.tick(1);

          sinon.assert.callCount(rtcDataChannel.send, 100);
        });

        it('should not send an empty packet', () => {
          const data: string[] = [];
          rtcDataChannel.send = (item: string) => data.push(item);
          rtcDataChannel.onopen();
          clock.tick(1);

          assert(data.every((item: string) => item && item.length));
        });
      });

      describe('on bitrate', () => {
        const message = { data: Array(1024).fill('h').join('') };

        let dataChannelEvent: any;
        let sendMessage: Function;

        const initBitrateTestObj = () => {
          clock = sinon.useFakeTimers(0);
          mediaConnectionBitrateTest = new MediaConnectionBitrateTest(options);
          clock.tick(1);
          dataChannelEvent = {
            channel: {
              onmessage: null, // Overridden
            },
          };
          rtcDataChannel.onopen();
          pcReceiverContext.ondatachannel(dataChannelEvent);
          sendMessage = dataChannelEvent.channel.onmessage;
        };

        beforeEach(() => {
          initBitrateTestObj();
        });

        afterEach(() => {
          clock.restore();
        });

        it('should not emit bitrate if no sample data is available', () => {
          const callback = sinon.stub();
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1000);

          sinon.assert.notCalled(callback);
        });

        it('should emit bitrate', () => {
          const callback = sinon.stub();
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1500);

          sendMessage(message);
          clock.tick(1200);

          const expectedBitrate = 8 * ((message.data.length * 2) - message.data.length) / 1000;
          sinon.assert.calledWithExactly(callback, expectedBitrate);
        });

        it('should stop emitting bitrate on stop', () => {
          const callback = sinon.stub();
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1200);

          sendMessage(message);
          clock.tick(1200);

          mediaConnectionBitrateTest.stop();
          sendMessage(message);
          clock.tick(1200);

          sinon.assert.calledOnce(callback);
        });

        it('should emit end event on stop', () => {
          const callback = sinon.stub();
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, callback);
          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);

          mediaConnectionBitrateTest.stop();
          sinon.assert.calledOnce(callback);
        });

        it('should generate a report', (done) => {
          const values: number[] = [];
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Bitrate, (bitrate: number) => values.push(bitrate));

          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, (report: MediaConnectionBitrateTest.Report) => {
            assert.deepStrictEqual(report, {
              averageBitrate: values.reduce((total: number, value: number) => total += value, 0) / values.length,
              errors: [],
              iceCandidateStats: [],
              testName: 'bitrate-test',
              testTiming: {
                duration: 3601,
                end: 3601,
                start: 0,
              },
              values,
            });
            done();
          });

          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);

          mediaConnectionBitrateTest.stop();
        });

        it('should include errors in a report', (done) => {
          pcSenderContext.addIceCandidate = () => ({
            catch: (cb: Function) => {
              cb('foo');
            },
          });
          const errors: DiagnosticError[] = [];
          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, (error: DiagnosticError) => errors.push(error));

          mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, (report: MediaConnectionBitrateTest.Report) => {
            assert.deepStrictEqual(report.errors, errors);
            done();
          });

          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);

          pcReceiverContext.onicecandidate({
            candidate: {
              candidate: 'relay',
            },
          });

          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);
        });

        describe('warnings', () => {
          const populateBitrateValues = (values: number[]) => {
            sendMessage(message);
            clock.tick(1200);
            sendMessage(message);
            mediaConnectionBitrateTest['_values'] = values;
            clock.tick(1200);
          };

          describe('when using minBitrateThreshold option', () => {
            beforeEach(() => {
              options.minBitrateThreshold = 500;
              initBitrateTestObj();
            });

            it('should emit warnings', () => {
              const callback = sinon.stub();
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, callback);

              populateBitrateValues([500, 500, 499, 499, 499]);
              sinon.assert.calledWithExactly(callback, WarningName.LowBitrate);
            });

            it('should not emit warnings', () => {
              const callback = sinon.stub();
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, callback);

              populateBitrateValues([500, 500, 500, 500, 500]);
              sinon.assert.notCalled(callback);
            });
          });

          describe('when using default threshold', () => {
            [
              [100, 100, 99, 99, 99],
              [100, 99, 99, 100, 99],
              [100, 100, 100, 99, 99, 99],
            ].forEach(values => {
              it(`should emit warning when values are ${values.join()}`, () => {
                const callback = sinon.stub();
                mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, callback);

                populateBitrateValues(values);
                sinon.assert.calledWithExactly(callback, WarningName.LowBitrate);
              });
            });

            [
              [100, 99, 99],
              [100, 99, 99, 100, 100],
              [99, 100, 100, 100, 99],
              [100, 100, 100, 99, 99],
            ].forEach(values => {
              it(`should not emit warning when values are ${values.join()}`, () => {
                const callback = sinon.stub();
                mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, callback);

                populateBitrateValues(values);
                sinon.assert.notCalled(callback);
              });
            });

            it('should not emit warning more than once', () => {
              const callback = sinon.stub();
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, callback);

              populateBitrateValues([100, 100, 99, 99, 99]);
              populateBitrateValues([99, 99, 99, 99, 99]);
              sinon.assert.calledWithExactly(callback, WarningName.LowBitrate);
              sinon.assert.calledOnce(callback);
            });

            it('should clear warning', () => {
              const onWarning = sinon.stub();
              const onWarningCleared = sinon.stub();
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, onWarning);
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.WarningCleared, onWarningCleared);

              populateBitrateValues([100, 100, 99, 99, 99]);
              populateBitrateValues([100, 100, 100, 100, 100]);
              sinon.assert.calledWithExactly(onWarning, WarningName.LowBitrate);
              sinon.assert.calledOnce(onWarning);
              sinon.assert.calledWithExactly(onWarningCleared, WarningName.LowBitrate);
              sinon.assert.calledOnce(onWarningCleared);
            });

            it('should not emit warning-cleared more than once', () => {
              const onWarning = sinon.stub();
              const onWarningCleared = sinon.stub();
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Warning, onWarning);
              mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.WarningCleared, onWarningCleared);

              populateBitrateValues([100, 100, 99, 99, 99]);
              populateBitrateValues([100, 100, 100, 100, 100]);
              populateBitrateValues([100, 100, 100, 100, 100]);
              sinon.assert.calledWithExactly(onWarning, WarningName.LowBitrate);
              sinon.assert.calledOnce(onWarning);
              sinon.assert.calledWithExactly(onWarningCleared, WarningName.LowBitrate);
              sinon.assert.calledOnce(onWarningCleared);
            });
          });
        });

        describe('ICE Candidate Stats', () => {
          const runMediaConnectionBitrateTest = (shouldStop: boolean) => {
            ['new', 'checking', 'connected', 'completed', 'disconnected', 'closed'].forEach(state => {
              pcSenderContext.iceConnectionState = state;
              pcSenderContext.oniceconnectionstatechange();
              clock.tick(1000);
            });

            sendMessage(message);
            clock.tick(1200);
            sendMessage(message);

            if (shouldStop) {
              mediaConnectionBitrateTest.stop();
            }
          };

          it('should include ICE Candidate stats in the report', (done) => {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest({
              ...options,
              getRTCIceCandidateStatsReport: () => ({then: (cb: Function) => {
                cb({
                  iceCandidateStats: ['foo', 'bar'],
                  selectedIceCandidatePairStats: {
                    localCandidate: 'foo',
                    remoteCandidate: 'bar',
                  },
                });
                return {catch: sinon.stub()};
              }}),
            });

            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, (report: MediaConnectionBitrateTest.Report) => {
              assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
              assert.deepStrictEqual(report.selectedIceCandidatePairStats, {
                localCandidate: 'foo',
                remoteCandidate: 'bar',
              });
              done();
            });

            runMediaConnectionBitrateTest(true);
          });

          it('should not include selected ICE Candidate stats in the report if no candidates were selected', (done) => {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest({
              ...options,
              getRTCIceCandidateStatsReport: () => ({then: (cb: Function) => {
                cb({
                  iceCandidateStats: ['foo', 'bar'],
                });
                return {catch: sinon.stub()};
              }}),
            });

            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, (report: MediaConnectionBitrateTest.Report) => {
              assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
              assert(!report.selectedIceCandidatePairStats);
              done();
            });

            runMediaConnectionBitrateTest(true);
          });

          it('should fail the test if stats are not available', (done) => {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest({
              ...options,
              getRTCIceCandidateStatsReport: () => ({then: () => {
                return {catch: (cb: Function) => {
                  cb('Foo error');
                }};
              }}),
            });

            const onError = sinon.stub();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.Error, onError);

            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest.Events.End, (report: MediaConnectionBitrateTest.Report) => {
              sinon.assert.calledOnce(onError);
              assert.equal(report.errors[0].domError, 'Foo error');
              done();
            });

            runMediaConnectionBitrateTest(false);
          });
        });
      });
    });
  });
});
