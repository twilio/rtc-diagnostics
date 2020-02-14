// tslint:disable only-arrow-functions

import * as assert from 'assert';

import {
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
