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
var constants_1 = require("../../lib/constants");
var MediaConnectionBitrateTest_1 = require("../../lib/MediaConnectionBitrateTest");
describe('MediaConnectionBitrateTest', function () {
    var root = global;
    var iceServers = [{
            credential: 'bar',
            url: 'turn:global.turn.twilio.com:3478?transport=udp',
            urls: 'turn:global.turn.twilio.com:3478?transport=udp',
            username: 'foo',
        }];
    var mediaConnectionBitrateTest;
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
        if (mediaConnectionBitrateTest) {
            mediaConnectionBitrateTest.stop();
        }
    });
    describe('testMediaConnectionBitrate', function () {
        it('should return MediaConnectionBitrateTest instance', function () {
            mediaConnectionBitrateTest = MediaConnectionBitrateTest_1.testMediaConnectionBitrate(options);
            assert(!!mediaConnectionBitrateTest);
        });
    });
    describe('constructor', function () {
        it('should use iceServers option', function () {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
            assert.deepEqual(pcReceiverContext.rtcConfiguration.iceServers, iceServers);
            assert.deepEqual(pcSenderContext.rtcConfiguration.iceServers, iceServers);
        });
        it('should use relay on the receiving peer connection', function () {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
            assert.equal(pcReceiverContext.rtcConfiguration.iceTransportPolicy, 'relay');
        });
        it('should not use relay on the sending peer connection', function () {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
            assert.equal(pcSenderContext.rtcConfiguration.iceTransportPolicy, undefined);
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
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
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
            it('should emit error on addIceCandidate failure', function () {
                pcSenderContext.addIceCandidate = function () { return ({
                    catch: function (cb) {
                        cb('foo');
                    },
                }); };
                setTimeout(function () { return pcReceiverContext.onicecandidate(event); });
                return expectEvent('error', mediaConnectionBitrateTest).then(function (result) {
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
            it('should emit error on addIceCandidate failure', function () {
                pcReceiverContext.addIceCandidate = function () { return ({
                    catch: function (cb) {
                        cb('foo');
                    },
                }); };
                setTimeout(function () { return pcSenderContext.onicecandidate(event); });
                return expectEvent('error', mediaConnectionBitrateTest).then(function (result) {
                    assert.equal(result.domError, 'foo');
                });
            });
        });
    });
    describe('setup RTCPeerConnections', function () {
        var wait = function () { return new Promise(function (r) { return setTimeout(r, 1); }); };
        beforeEach(function () {
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
            mediaConnectionBitrateTest.stop = sinon.spy(mediaConnectionBitrateTest.stop);
        });
        it('should throw error on createOffer failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcSenderContext.createOffer = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create offer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
        it('should throw error on sender setLocalDescription failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcSenderContext.setLocalDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
        it('should throw error on receiver setRemoteDescription failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcReceiverContext.setRemoteDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createOffer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
        it('should throw error on createAnswer failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcReceiverContext.createAnswer = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to create answer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
        it('should throw error on receiver setLocalDescription failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcReceiverContext.setLocalDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
        it('should throw error on sender setRemoteDescription failure', function () {
            var callback = sinon.spy();
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, callback);
            pcSenderContext.setRemoteDescription = function () { return Promise.reject('foo'); };
            return wait().then(function () {
                sinon.assert.calledWith(callback, sinon.match.has('domError', 'foo'));
                sinon.assert.calledWith(callback, sinon.match.has('message', 'Unable to set local or remote description from createAnswer'));
                sinon.assert.called(mediaConnectionBitrateTest.stop);
            });
        });
    });
    describe('setup data channel', function () {
        var clock;
        beforeEach(function () {
            clock = sinon.useFakeTimers(0);
            mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
            mediaConnectionBitrateTest.stop = sinon.spy(mediaConnectionBitrateTest.stop);
        });
        afterEach(function () {
            clock.restore();
        });
        it('should emit error on createDataChannel failure', function (done) {
            pcSenderContext.createDataChannel = function () { throw new Error(); };
            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, function (error) {
                assert.equal(error.message, 'Error creating data channel');
                sinon.assert.notCalled(mediaConnectionBitrateTest.stop);
                done();
            });
            clock.tick(1);
        });
        describe('when the test times out', function () {
            it('should emit an error and call stop', function () {
                rtcDataChannel.readyState = 'open';
                var errorName = '';
                mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, function (error) {
                    errorName = error.name;
                });
                clock.tick(15100);
                sinon.assert.calledOnce(mediaConnectionBitrateTest.stop);
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
                var initBitrateTestObj = function () {
                    clock = sinon.useFakeTimers(0);
                    mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(options);
                    clock.tick(1);
                    dataChannelEvent = {
                        channel: {
                            onmessage: null,
                        },
                    };
                    rtcDataChannel.onopen();
                    pcReceiverContext.ondatachannel(dataChannelEvent);
                    sendMessage = dataChannelEvent.channel.onmessage;
                };
                beforeEach(function () {
                    initBitrateTestObj();
                });
                afterEach(function () {
                    clock.restore();
                });
                it('should not emit bitrate if no sample data is available', function () {
                    var callback = sinon.stub();
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1000);
                    sinon.assert.notCalled(callback);
                });
                it('should emit bitrate', function () {
                    var callback = sinon.stub();
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1500);
                    sendMessage(message);
                    clock.tick(1200);
                    var expectedBitrate = 8 * ((message.data.length * 2) - message.data.length) / 1000;
                    sinon.assert.calledWithExactly(callback, expectedBitrate);
                });
                it('should stop emitting bitrate on stop', function () {
                    var callback = sinon.stub();
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Bitrate, callback);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    mediaConnectionBitrateTest.stop();
                    sendMessage(message);
                    clock.tick(1200);
                    sinon.assert.calledOnce(callback);
                });
                it('should emit end event on stop', function () {
                    var callback = sinon.stub();
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, callback);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    sendMessage(message);
                    clock.tick(1200);
                    mediaConnectionBitrateTest.stop();
                    sinon.assert.calledOnce(callback);
                });
                it('should generate a report', function (done) {
                    var values = [];
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Bitrate, function (bitrate) { return values.push(bitrate); });
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (report) {
                        assert.deepStrictEqual(report, {
                            averageBitrate: values.reduce(function (total, value) { return total += value; }, 0) / values.length,
                            errors: [],
                            iceCandidateStats: [],
                            testName: 'media-connection-bitrate-test',
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
                    mediaConnectionBitrateTest.stop();
                });
                it('should include errors in a report', function (done) {
                    pcSenderContext.addIceCandidate = function () { return ({
                        catch: function (cb) {
                            cb('foo');
                        },
                    }); };
                    var errors = [];
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, function (error) { return errors.push(error); });
                    mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (report) {
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
                describe('warnings', function () {
                    var populateBitrateValues = function (values) {
                        sendMessage(message);
                        clock.tick(1200);
                        sendMessage(message);
                        mediaConnectionBitrateTest['_values'] = values;
                        clock.tick(1200);
                    };
                    describe('when using minBitrateThreshold option', function () {
                        beforeEach(function () {
                            options.minBitrateThreshold = 500;
                            initBitrateTestObj();
                        });
                        it('should emit warnings', function () {
                            var callback = sinon.stub();
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, callback);
                            populateBitrateValues([500, 500, 499, 499, 499]);
                            sinon.assert.calledWithExactly(callback, constants_1.WarningName.LowBitrate);
                        });
                        it('should not emit warnings', function () {
                            var callback = sinon.stub();
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, callback);
                            populateBitrateValues([500, 500, 500, 500, 500]);
                            sinon.assert.notCalled(callback);
                        });
                    });
                    describe('when using default threshold', function () {
                        [
                            [100, 100, 99, 99, 99],
                            [100, 99, 99, 100, 99],
                            [100, 100, 100, 99, 99, 99],
                        ].forEach(function (values) {
                            it("should emit warning when values are " + values.join(), function () {
                                var callback = sinon.stub();
                                mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, callback);
                                populateBitrateValues(values);
                                sinon.assert.calledWithExactly(callback, constants_1.WarningName.LowBitrate);
                            });
                        });
                        [
                            [100, 99, 99],
                            [100, 99, 99, 100, 100],
                            [99, 100, 100, 100, 99],
                            [100, 100, 100, 99, 99],
                        ].forEach(function (values) {
                            it("should not emit warning when values are " + values.join(), function () {
                                var callback = sinon.stub();
                                mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, callback);
                                populateBitrateValues(values);
                                sinon.assert.notCalled(callback);
                            });
                        });
                        it('should not emit warning more than once', function () {
                            var callback = sinon.stub();
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, callback);
                            populateBitrateValues([100, 100, 99, 99, 99]);
                            populateBitrateValues([99, 99, 99, 99, 99]);
                            sinon.assert.calledWithExactly(callback, constants_1.WarningName.LowBitrate);
                            sinon.assert.calledOnce(callback);
                        });
                        it('should clear warning', function () {
                            var onWarning = sinon.stub();
                            var onWarningCleared = sinon.stub();
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, onWarning);
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.WarningCleared, onWarningCleared);
                            populateBitrateValues([100, 100, 99, 99, 99]);
                            populateBitrateValues([100, 100, 100, 100, 100]);
                            sinon.assert.calledWithExactly(onWarning, constants_1.WarningName.LowBitrate);
                            sinon.assert.calledOnce(onWarning);
                            sinon.assert.calledWithExactly(onWarningCleared, constants_1.WarningName.LowBitrate);
                            sinon.assert.calledOnce(onWarningCleared);
                        });
                        it('should not emit warning-cleared more than once', function () {
                            var onWarning = sinon.stub();
                            var onWarningCleared = sinon.stub();
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Warning, onWarning);
                            mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.WarningCleared, onWarningCleared);
                            populateBitrateValues([100, 100, 99, 99, 99]);
                            populateBitrateValues([100, 100, 100, 100, 100]);
                            populateBitrateValues([100, 100, 100, 100, 100]);
                            sinon.assert.calledWithExactly(onWarning, constants_1.WarningName.LowBitrate);
                            sinon.assert.calledOnce(onWarning);
                            sinon.assert.calledWithExactly(onWarningCleared, constants_1.WarningName.LowBitrate);
                            sinon.assert.calledOnce(onWarningCleared);
                        });
                    });
                });
                describe('ICE Candidate Stats', function () {
                    var runMediaConnectionBitrateTest = function (shouldStop) {
                        ['new', 'checking', 'connected', 'completed', 'disconnected', 'closed'].forEach(function (state) {
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
                    it('should include ICE Candidate stats in the report', function (done) {
                        mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function (cb) {
                                    cb({
                                        iceCandidateStats: ['foo', 'bar'],
                                        selectedIceCandidatePairStats: {
                                            localCandidate: 'foo',
                                            remoteCandidate: 'bar',
                                        },
                                    });
                                    return { catch: sinon.stub() };
                                } }); } }));
                        mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (report) {
                            assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
                            assert.deepStrictEqual(report.selectedIceCandidatePairStats, {
                                localCandidate: 'foo',
                                remoteCandidate: 'bar',
                            });
                            done();
                        });
                        runMediaConnectionBitrateTest(true);
                    });
                    it('should not include selected ICE Candidate stats in the report if no candidates were selected', function (done) {
                        mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function (cb) {
                                    cb({
                                        iceCandidateStats: ['foo', 'bar'],
                                    });
                                    return { catch: sinon.stub() };
                                } }); } }));
                        mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (report) {
                            assert.deepStrictEqual(report.iceCandidateStats, ['foo', 'bar']);
                            assert(!report.selectedIceCandidatePairStats);
                            done();
                        });
                        runMediaConnectionBitrateTest(true);
                    });
                    it('should fail the test if stats are not available', function (done) {
                        mediaConnectionBitrateTest = new MediaConnectionBitrateTest_1.MediaConnectionBitrateTest(__assign(__assign({}, options), { getRTCIceCandidateStatsReport: function () { return ({ then: function () {
                                    return { catch: function (cb) {
                                            cb('Foo error');
                                        } };
                                } }); } }));
                        var onError = sinon.stub();
                        mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.Error, onError);
                        mediaConnectionBitrateTest.on(MediaConnectionBitrateTest_1.MediaConnectionBitrateTest.Events.End, function (report) {
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
//# sourceMappingURL=MediaConnectionBitrateTest.js.map