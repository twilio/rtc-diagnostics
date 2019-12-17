// tslint:disable only-arrow-functions

import * as assert from 'assert';

import {
  filterIceServerUrls,
  testNetwork,
} from '../../lib/NetworkTest';
import { mockRTCPeerConnectionFactory } from '../mocks/MockRTCPeerConnection';

describe('testNetwork', function() {
  it('should return a report', async function() {
    const report = await testNetwork({
      peerConnectionFactory: mockRTCPeerConnectionFactory({
        candidate: 'testCandidate',
        mockRTCDataChannelFactoryOptions: {
          doClose: true,
          doMessage: true,
          doOpen: true,
        },
      }) as any,
    });
    assert(report);
  });

  it('should still return a report without any ice candidates', async function() {
    const report = await testNetwork({
      peerConnectionFactory: mockRTCPeerConnectionFactory({
        candidate: null,
        mockRTCDataChannelFactoryOptions: {
          doClose: true,
          doMessage: true,
          doOpen: true,
        },
      }) as any,
    });
    assert(report);
  });

  it('should fail if a message is never received', async function() {
    await assert.rejects(() =>
      testNetwork({
        peerConnectionFactory: mockRTCPeerConnectionFactory({
          candidate: 'test',
          mockRTCDataChannelFactoryOptions: {
            doClose: true,
            doMessage: false,
            doOpen: true,
          },
        }) as any,
        timeoutMs: 10,
      }),
    );
  });
});

const iceServers: RTCIceServer[] = [{
  credential: 'foo',
  credentialType: 'password',
  urls: ['stun:test.example:9999?transport=udp'],
  username: 'bar',
}, {
  credential: 'foo',
  credentialType: 'password',
  urls: ['turn:test.example:9999?transport=udp'],
  username: 'bar',
}, {
  credential: 'foo',
  credentialType: 'password',
  urls: ['turn:test.example:9999?transport=tcp'],
  username: 'bar',
}];

describe('filterIceServerUrls', function() {
  it('should filter servers based on protocol', function() {
    const filter = filterIceServerUrls(iceServers, 'udp', 'stun');
    assert.equal(iceServers[0], filter[0]);
  });
  it('should filter servers based on protocol', function() {
    const filter = filterIceServerUrls(iceServers, 'udp', 'turn');
    assert.equal(iceServers[1], filter[0]);
  });
  it('should filter servers based on protocol', function() {
    const filter = filterIceServerUrls(iceServers, 'tcp', 'turn');
    assert.equal(iceServers[2], filter[0]);
  });
});
