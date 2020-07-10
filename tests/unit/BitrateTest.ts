import * as assert from 'assert';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import { BitrateTest, testBitrate } from '../../lib/BitrateTest';
import { DiagnosticError } from '../../lib/errors/DiagnosticError';

describe('BitrateTest', () => {
  const root = (global as any);
  const iceServers = [{
    credential: 'bar',
    url: 'turn:global.turn.twilio.com:3478?transport=udp',
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: 'foo',
  }];

  let bitrateTest: BitrateTest;
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

    bitrateTest = new BitrateTest(options);
  });

  afterEach(() => {
    pcReceiverContext = null;
    pcSenderContext = null;
    root.RTCPeerConnection = originalRTCPeerConnection;
  });

  describe('testBitrate', () => {
    it('should return BitrateTest instance', () => {
      bitrateTest = testBitrate(options);
      assert(!!bitrateTest);
    });
  });

  describe('constructor', () => {
    it('should use iceServers option', () => {
      bitrateTest = new BitrateTest(options);
      assert.deepEqual(pcReceiverContext.rtcConfiguration.iceServers, iceServers);
      assert.deepEqual(pcSenderContext.rtcConfiguration.iceServers, iceServers);
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

      it('should not add ICE candidate if candidate is not relay', () => {
        event.candidate.candidate = candidateHost;
        pcReceiverContext.onicecandidate(event);
        sinon.assert.notCalled(pcSenderContext.addIceCandidate);
      });

      it('should emit error on addIceCandidate failure', () => {
        pcSenderContext.addIceCandidate = () => ({
          catch: (cb: Function) => {
            cb('foo');
          },
        });

        setTimeout(() => pcReceiverContext.onicecandidate(event));

        return expectEvent('error', bitrateTest).then((result: any) => {
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

      it('should not add ICE candidate if candidate is not relay', () => {
        event.candidate.candidate = candidateHost;
        pcSenderContext.onicecandidate(event);
        sinon.assert.notCalled(pcReceiverContext.addIceCandidate);
      });

      it('should emit error on addIceCandidate failure', () => {
        pcReceiverContext.addIceCandidate = () => ({
          catch: (cb: Function) => {
            cb('foo');
          },
        });

        setTimeout(() => pcSenderContext.onicecandidate(event));

        return expectEvent('error', bitrateTest).then((result: any) => {
          assert.equal(result.domError, 'foo');
        });
      });
    });
  });

  describe('setup RTCPeerConnections', () => {
    const wait = () => new Promise(r => setTimeout(r, 1));

    beforeEach(() => {
      bitrateTest = new BitrateTest(options);
      bitrateTest.stop = sinon.stub();
    });

    it('should throw error on createOffer failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcSenderContext.createOffer = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create offer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });

    it('should throw error on sender setLocalDescription failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcSenderContext.setLocalDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });

    it('should throw error on receiver setRemoteDescription failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcReceiverContext.setRemoteDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });

    it('should throw error on createAnswer failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcReceiverContext.createAnswer = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create answer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });

    it('should throw error on receiver setLocalDescription failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcReceiverContext.setLocalDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });

    it('should throw error on sender setRemoteDescription failure', () => {
      const callback = sinon.spy();
      bitrateTest.on(BitrateTest.Events.Error, callback);
      pcSenderContext.setRemoteDescription = () => Promise.reject('foo');

      return wait().then(() => {
        sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
        sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
        sinon.assert.called(bitrateTest.stop as any);
      });
    });
  });

  describe('setup data channel', () => {
    let clock: SinonFakeTimers;

    beforeEach(() => {
      clock = sinon.useFakeTimers(0);
      bitrateTest = new BitrateTest(options);
      bitrateTest.stop = sinon.stub();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should emit error on createDataChannel failure', (done) => {
      pcSenderContext.createDataChannel = () => { throw new Error(); };
      bitrateTest.on(BitrateTest.Events.Error, (error: DiagnosticError) => {
        assert.equal(error.message, 'Error creating data channel');
        sinon.assert.notCalled(bitrateTest.stop as any);
        done();
      });
      clock.tick(1);
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

        beforeEach(() => {
          clock = sinon.useFakeTimers(0);
          bitrateTest = new BitrateTest(options);
          clock.tick(1);
          dataChannelEvent = {
            channel: {
              onmessage: null, // Overridden
            },
          };
          rtcDataChannel.onopen();
          pcReceiverContext.ondatachannel(dataChannelEvent);
          sendMessage = dataChannelEvent.channel.onmessage;
        });

        afterEach(() => {
          clock.restore();
        });

        it('should not emit bitrate if no sample data is available', () => {
          const callback = sinon.stub();
          bitrateTest.on(BitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1000);

          sinon.assert.notCalled(callback);
        });

        it('should emit bitrate', () => {
          const callback = sinon.stub();
          bitrateTest.on(BitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1500);

          sendMessage(message);
          clock.tick(1200);

          const expectedBitrate = 8 * ((message.data.length * 2) - message.data.length) / 1000;
          sinon.assert.calledWithExactly(callback, expectedBitrate);
        });

        it('should stop emitting bitrate on stop', () => {
          const callback = sinon.stub();
          bitrateTest.on(BitrateTest.Events.Bitrate, callback);

          sendMessage(message);
          clock.tick(1200);

          sendMessage(message);
          clock.tick(1200);

          bitrateTest.stop();
          sendMessage(message);
          clock.tick(1200);

          sinon.assert.calledOnce(callback);
        });

        it('should emit end event on stop', () => {
          const callback = sinon.stub();
          bitrateTest.on(BitrateTest.Events.End, callback);
          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);
          sendMessage(message);
          clock.tick(1200);

          bitrateTest.stop();
          sinon.assert.calledOnce(callback);
        });

        it('should generate a report', (done) => {
          const values: number[] = [];
          bitrateTest.on(BitrateTest.Events.Bitrate, (bitrate: number) => values.push(bitrate));

          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert.deepStrictEqual(report, {
              averageBitrate: values.reduce((total: number, value: number) => total += value, 0) / values.length,
              didPass: false,
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

          bitrateTest.stop();
        });

        it('should fail if average bitrate is below minimum', (done) => {
          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert(!report.didPass);
            done();
          });

          sendMessage(message);
          clock.tick(1200);
          bitrateTest['_values'] = [99, 99, 99];
          bitrateTest.stop();
        });

        it('should pass if average bitrate is above minimum', (done) => {
          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert(report.didPass);
            done();
          });

          sendMessage(message);
          clock.tick(1200);
          bitrateTest['_values'] = [101, 101, 101];
          bitrateTest.stop();
        });

        it('should pass if average bitrate is exactly equal to minimum', (done) => {
          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert(report.didPass);
            done();
          });

          sendMessage(message);
          clock.tick(1200);
          bitrateTest['_values'] = [100, 100, 100];
          bitrateTest.stop();
        });

        it('should not pass test if no values are found', (done) => {
          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert.deepStrictEqual(report.didPass, false);
            done();
          });

          clock.tick(4000);
          bitrateTest.stop();
        });

        it('should include errors in a report', (done) => {
          pcSenderContext.addIceCandidate = () => ({
            catch: (cb: Function) => {
              cb('foo');
            },
          });
          const errors: DiagnosticError[] = [];
          bitrateTest.on(BitrateTest.Events.Error, (error: DiagnosticError) => errors.push(error));

          bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
            assert.deepStrictEqual(report.errors, errors);
            assert.deepStrictEqual(report.didPass, false);
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

        describe('ICE Candidate Stats', () => {
          const runBitrateTest = (shouldStop: boolean) => {
            ['new', 'checking', 'connected', 'completed', 'disconnected', 'closed'].forEach(state => {
              pcSenderContext.iceConnectionState = state;
              pcSenderContext.oniceconnectionstatechange();
              clock.tick(1000);
            });

            sendMessage(message);
            clock.tick(1200);
            sendMessage(message);

            if (shouldStop) {
              bitrateTest.stop();
            }
          };

          it('should include ICE Candidate stats in the report', (done) => {
            bitrateTest = new BitrateTest({
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

            bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
              assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
              assert.deepStrictEqual(report.selectedIceCandidatePairStats, {
                localCandidate: 'foo',
                remoteCandidate: 'bar',
              });
              done();
            });

            runBitrateTest(true);
          });

          it('should not include selected ICE Candidate stats in the report if no candidates were selected', (done) => {
            bitrateTest = new BitrateTest({
              ...options,
              getRTCIceCandidateStatsReport: () => ({then: (cb: Function) => {
                cb({
                  iceCandidateStats: ['foo', 'bar'],
                });
                return {catch: sinon.stub()};
              }}),
            });

            bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
              assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
              assert(!report.selectedIceCandidatePairStats);
              done();
            });

            runBitrateTest(true);
          });

          it('should fail the test if stats are not available', (done) => {
            bitrateTest = new BitrateTest({
              ...options,
              getRTCIceCandidateStatsReport: () => ({then: () => {
                return {catch: (cb: Function) => {
                  cb('Foo error');
                }};
              }}),
            });

            const onError = sinon.stub();
            bitrateTest.on(BitrateTest.Events.Error, onError);

            bitrateTest.on(BitrateTest.Events.End, (report: BitrateTest.Report) => {
              sinon.assert.calledOnce(onError);
              assert(!report.didPass);
              assert.equal(report.errors[0].domError, 'Foo error');
              done();
            });

            runBitrateTest(false);
          });
        });
      });
    });
  });
});
