"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var sinon = require("sinon");
var BitrateTest_1 = require("../../lib/BitrateTest");
var constants_1 = require("../../lib/constants");
describe('BitrateTest', function () {
    var root = global;
    var iceServers = [{
            credential: 'bar',
            url: 'turn:global.turn.twilio.com:3478?transport=udp',
            urls: 'turn:global.turn.twilio.com:3478?transport=udp',
            username: 'foo',
        }];
    var bitrateTest;
    var originalRTCPeerConnection;
    var options;
    var pcReceiverContext;
    var pcSenderContext;
    var rtcDataChannel;
    var pcCreationCount = 0;
    var expectEvent = function (eventName, emitter) {
        return new Promise(function (resolve) { return emitter.once(eventName, function (res) { return resolve(res); }); });
    };
    var getPeerConnectionFactory = function () {
        return function (rtcConfiguration) {
            this.rtcConfiguration = rtcConfiguration;
            this.close = sinon.stub();
            this.setLocalDescription = sinon.stub();
            this.setRemoteDescription = sinon.stub();
            this.createAnswer = sinon.stub().returns(Promise.resolve());
            this.createOffer = sinon.stub().returns(Promise.resolve());
            this.addIceCandidate = sinon.stub().returns({ catch: sinon.stub() });
            this.createDataChannel = sinon.stub().returns(rtcDataChannel);
            // The tests always uses 2 PeerConnections
            // The first one is always the receiver
            // Let's capture them for mocking
            pcCreationCount++;
            if (pcCreationCount % 2 === 1) {
                pcReceiverContext = this;
            }
            else {
                pcSenderContext = this;
            }
        };
    };
    beforeEach(function () {
        options = {
            getRTCIceCandidateStatsReport: sinon.stub()
                .resolves({
                iceCandidateStats: [],
            }),
            iceServers: iceServers,
        };
        rtcDataChannel = {
            send: sinon.stub(),
        };
        originalRTCPeerConnection = root.RTCPeerConnection;
        root.RTCPeerConnection = getPeerConnectionFactory();
    });
    afterEach(function () {
        pcReceiverContext = null;
        pcSenderContext = null;
        root.RTCPeerConnection = originalRTCPeerConnection;
        if (bitrateTest) {
            bitrateTest.stop();
        }
    });
    describe('testBitrate', function () {
        it('should return BitrateTest instance', function () {
            bitrateTest = BitrateTest_1.testBitrate(options);
            assert(!!bitrateTest);
        });
    });
    describe('constructor', function () {
        it('should use iceServers option', function () {
            bitrateTest = new BitrateTest_1.BitrateTest(options);
            assert.deepEqual(pcReceiverContext.rtcConfiguration.iceServers, iceServers);
            assert.deepEqual(pcSenderContext.rtcConfiguration.iceServers, iceServers);
        });
    });
    describe('onicecandidate', function () {
        var candidateRelay = 'candidate:1 1 udp 22 1.2.3.4 44 typ relay raddr 1.2.3.4 rport 55 generation 0 ufrag UqY3 network-id 2';
        var candidateHost = 'candidate:1 1 tcp 22 1.2.3.4 9 typ host tcptype active generation 0 ufrag ARCY network-id 3';
        var event;
        beforeEach(function () {
            event = {
                candidate: {
                    candidate: candidateRelay,
                },
            };
            bitrateTest = new BitrateTest_1.BitrateTest(options);
        });
        context('receiver pc', function () {
            it('should add ICE candidate to remote pc', function () {
                pcReceiverContext.onicecandidate(event);
                sinon.assert.calledWithExactly(pcSenderContext.addIceCandidate, event.candidate);
            });
            it('should not add ICE candidate if candidate event is empty', function () {
                pcReceiverContext.onicecandidate({});
                sinon.assert.notCalled(pcSenderContext.addIceCandidate);
            });
            it('should not add ICE candidate if candidate is not relay', function () {
                event.candidate.candidate = candidateHost;
                pcReceiverContext.onicecandidate(event);
                sinon.assert.notCalled(pcSenderContext.addIceCandidate);
            });
            it('should emit error on addIceCandidate failure', function () {
                pcSenderContext.addIceCandidate = function () { return ({
                    catch: function (cb) {
                        cb('foo');
                    },
                }); };
                setTimeout(function () { return pcReceiverContext.onicecandidate(event); });
                return expectEvent('error', bitrateTest).then(function (result) {
                    assert.equal(result.domError, 'foo');
                });
            });
        });
        context('sender pc', function () {
            it('should add ICE candidate to remote pc', function () {
                pcSenderContext.onicecandidate(event);
                sinon.assert.calledWithExactly(pcReceiverContext.addIceCandidate, event.candidate);
            });
            it('should not add ICE candidate if candidate event is empty', function () {
                pcSenderContext.onicecandidate({});
                sinon.assert.notCalled(pcReceiverContext.addIceCandidate);
            });
            it('should not add ICE candidate if candidate is not relay', function () {
                event.candidate.candidate = candidateHost;
                pcSenderContext.onicecandidate(event);
                sinon.assert.notCalled(pcReceiverContext.addIceCandidate);
            });
            it('should emit error on addIceCandidate failure', function () {
                pcReceiverContext.addIceCandidate = function () { return ({
                    catch: function (cb) {
                        cb('foo');
                    },
                }); };
                setTimeout(function () { return pcSenderContext.onicecandidate(event); });
                return expectEvent('error', bitrateTest).then(function (result) {
                    assert.equal(result.domError, 'foo');
                });
            });
        });
    });
    describe('setup RTCPeerConnections', function () {
        var wait = function () { return new Promise(function (r) { return setTimeout(r, 1); }); };
        beforeEach(function () {
            bitrateTest = new BitrateTest_1.BitrateTest(options);
            bitrateTest.stop = sinon.spy(bitrateTest.stop);
        });
        it('should throw error on createOffer failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcSenderContext.createOffer = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create offer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
        it('should throw error on sender setLocalDescription failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcSenderContext.setLocalDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
        it('should throw error on receiver setRemoteDescription failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcReceiverContext.setRemoteDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
        it('should throw error on createAnswer failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcReceiverContext.createAnswer = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create answer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
        it('should throw error on receiver setLocalDescription failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcReceiverContext.setLocalDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
        it('should throw error on sender setRemoteDescription failure', function () {
            var callback = sinon.spy();
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, callback);
            pcSenderContext.setRemoteDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
                sinon.assert.called(bitrateTest.stop);
            });
        });
    });
    describe('setup data channel', function () {
        var clock;
        beforeEach(function () {
            clock = sinon.useFakeTimers(0);
            bitrateTest = new BitrateTest_1.BitrateTest(options);
            bitrateTest.stop = sinon.spy(bitrateTest.stop);
        });
        afterEach(function () {
            clock.restore();
        });
        it('should emit error on createDataChannel failure', function (done) {
            pcSenderContext.createDataChannel = function () { throw new Error(); };
            bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, function (error) {
                assert.equal(error.message, 'Error creating data channel');
                sinon.assert.notCalled(bitrateTest.stop);
                done();
            });
            clock.tick(1);
        });
        describe('when the test times out', function () {
            it('should emit an error and call stop', function () {
                rtcDataChannel.readyState = 'open';
                var errorName = '';
                bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, function (error) {
                    errorName = error.name;
                });
                clock.tick(15100);
                sinon.assert.calledOnce(bitrateTest.stop);
                assert.equal(errorName, constants_1.ErrorName.DiagnosticError);
            });
        });
        describe('after creating successfully', function () {
            describe('send message', function () {
                beforeEach(function () {
                    clock.tick(1);
                    rtcDataChannel.readyState = 'open';
                });
                it('should not send data if rtcDataChannel is not open', function () {
                    rtcDataChannel.readyState = 'connecting';
                    rtcDataChannel.onopen();
                    clock.tick(1);
                    sinon.assert.notCalled(rtcDataChannel.send);
                });
                it('should not send data if max buffer is reached', function () {
                    rtcDataChannel.bufferedAmount = 999999;
                    rtcDataChannel.onopen();
                    clock.tick(1);
                    sinon.assert.notCalled(rtcDataChannel.send);
                });
                it('should send max data allowed', function () {
                    rtcDataChannel.onopen();
                    clock.tick(1);
                    sinon.assert.callCount(rtcDataChannel.send, 100);
                });
                it('should not send an empty packet', function () {
                    var data = [];
                    rtcDataChannel.send = function (item) { return data.push(item); };
                    rtcDataChannel.onopen();
                    clock.tick(1);
                    assert(data.every(function (item) { return item && item.length; }));
                });
            });
            describe('on bitrate', function () {
                var message = { data: Array(1024).fill('h').join('') };
                var dataChannelEvent;
                var sendMessage;
                beforeEach(function () {
                    clock = sinon.useFakeTimers(0);
                    bitrateTest = new BitrateTest_1.BitrateTest(options);
                    clock.tick(1);
                    dataChannelEvent = {
                        channel: {
                            onmessage: null,
                        },
                    };
                    rtcDataChannel.onopen();
                    pcReceiverContext.ondatachannel(dataChannelEvent);
                    sendMessage = dataChannelEvent.channel.onmessage;
                });
                afterEach(function () {
                    clock.restore();
                });
                it('should not emit bitrate if no sample data is available', function () {
                    var callback = sinon.stub();
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1000);
                    sinon.assert.notCalled(callback);
                });
                it('should emit bitrate', function () {
                    var callback = sinon.stub();
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1500);
                    sendMessage(message);
                    clock.tick(1200);
                    var expectedBitrate = 8 * ((message.data.length * 2) - message.data.length) / 1000;
                    sinon.assert.calledWithExactly(callback, expectedBitrate);
                });
                it('should stop emitting bitrate on stop', function () {
                    var callback = sinon.stub();
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    bitrateTest.stop();
                    sendMessage(message);
                    clock.tick(1200);
                    sinon.assert.calledOnce(callback);
                });
                it('should emit end event on stop', function () {
                    var callback = sinon.stub();
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, callback);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    bitrateTest.stop();
                    sinon.assert.calledOnce(callback);
                });
                it('should generate a report', function (done) {
                    var values = [];
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.Bitrate, function (bitrate) { return values.push(bitrate); });
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                        assert.deepStrictEqual(report, {
                            averageBitrate: values.reduce(function (total, value) { return total += value; }, 0) / values.length,
                            didPass: false,
                            errors: [],
                            iceCandidateStats: [],
                            testName: 'bitrate-test',
                            testTiming: {
                                duration: 3601,
                                end: 3601,
                                start: 0,
                            },
                            values: values,
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
                it('should fail if average bitrate is below minimum', function (done) {
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                        assert(!report.didPass);
                        done();
                    });
                    sendMessage(message);
                    clock.tick(1200);
                    bitrateTest['_values'] = [99, 99, 99];
                    bitrateTest.stop();
                });
                it('should pass if average bitrate is above minimum', function (done) {
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                        assert(report.didPass);
                        done();
                    });
                    sendMessage(message);
                    clock.tick(1200);
                    bitrateTest['_values'] = [101, 101, 101];
                    bitrateTest.stop();
                });
                it('should pass if average bitrate is exactly equal to minimum', function (done) {
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                        assert(report.didPass);
                        done();
                    });
                    sendMessage(message);
                    clock.tick(1200);
                    bitrateTest['_values'] = [100, 100, 100];
                    bitrateTest.stop();
                });
                it('should not pass test if no values are found', function (done) {
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                        assert.deepStrictEqual(report.didPass, false);
                        done();
                    });
                    clock.tick(4000);
                    bitrateTest.stop();
                });
                it('should include errors in a report', function (done) {
                    pcSenderContext.addIceCandidate = function () { return ({
                        catch: function (cb) {
                            cb('foo');
                        },
                    }); };
                    var errors = [];
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, function (error) { return errors.push(error); });
                    bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
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
                describe('ICE Candidate Stats', function () {
                    var runBitrateTest = function (shouldStop) {
                        ['new', 'checking', 'connected', 'completed', 'disconnected', 'closed'].forEach(function (state) {
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
                    it('should include ICE Candidate stats in the report', function (done) {
                        bitrateTest = new BitrateTest_1.BitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function (cb) {
                                    cb({
                                        iceCandidateStats: ['foo', 'bar'],
                                        selectedIceCandidatePairStats: {
                                            localCandidate: 'foo',
                                            remoteCandidate: 'bar',
                                        },
                                    });
                                    return { catch: sinon.stub() };
                                } }); } }));
                        bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                            assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
                            assert.deepStrictEqual(report.selectedIceCandidatePairStats, {
                                localCandidate: 'foo',
                                remoteCandidate: 'bar',
                            });
                            done();
                        });
                        runBitrateTest(true);
                    });
                    it('should not include selected ICE Candidate stats in the report if no candidates were selected', function (done) {
                        bitrateTest = new BitrateTest_1.BitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function (cb) {
                                    cb({
                                        iceCandidateStats: ['foo', 'bar'],
                                    });
                                    return { catch: sinon.stub() };
                                } }); } }));
                        bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
                            assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
                            assert(!report.selectedIceCandidatePairStats);
                            done();
                        });
                        runBitrateTest(true);
                    });
                    it('should fail the test if stats are not available', function (done) {
                        bitrateTest = new BitrateTest_1.BitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function () {
                                    return { catch: function (cb) {
                                            cb('Foo error');
                                        } };
                                } }); } }));
                        var onError = sinon.stub();
                        bitrateTest.on(BitrateTest_1.BitrateTest.Events.Error, onError);
                        bitrateTest.on(BitrateTest_1.BitrateTest.Events.End, function (report) {
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
//# sourceMappingURL=BitrateTest.js.map