// tslint:disable only-arrow-functions

import * as assert from 'assert';
import * as sinon from 'sinon';

import { DiagnosticError } from '../../lib/errors';
import {
  NetworkTest,
  testNetwork,
} from '../../lib/NetworkTest';
import { mockRTCPeerConnectionFactory } from '../mocks/MockRTCPeerConnection';

const timeoutMs = 25;

describe('testNetwork', function() {
  let errorHandler: sinon.SinonSpy;
  let endHandler: sinon.SinonSpy;

  beforeEach(function() {
    errorHandler = sinon.spy();
    endHandler = sinon.spy();
  });

  it('should return a report', async function() {
    const report: NetworkTest.Report =
      await new Promise((resolve: (report: NetworkTest.Report) => void) => {
        const test = testNetwork({
          peerConnectionFactory: mockRTCPeerConnectionFactory({
            candidate: 'test',
            mockRTCDataChannelFactoryOptions: {
              doClose: true,
              doMessage: true,
              doOpen: true,
            },
          }) as any,
          timeoutMs,
        });
        test.on(NetworkTest.Events.Error, errorHandler);
        test.on(NetworkTest.Events.End, (r: NetworkTest.Report) => {
          endHandler(r);
          setTimeout(() => resolve(r), timeoutMs);
        });
      });
    assert(report);
    assert(report.didPass);
    assert(report.networkTiming);
  });

  it('should still return a report without any ice candidates', async function() {
    const report: NetworkTest.Report =
      await new Promise((resolve: (report: NetworkTest.Report) => void) => {
        const test = testNetwork({
          peerConnectionFactory: mockRTCPeerConnectionFactory({
            candidate: null,
            mockRTCDataChannelFactoryOptions: {
              doClose: true,
              doMessage: true,
              doOpen: true,
            },
          }) as any,
          timeoutMs,
        });
        test.on(NetworkTest.Events.Error, errorHandler);
        test.on(NetworkTest.Events.End, (r: NetworkTest.Report) => {
          endHandler(r);
          setTimeout(() => resolve(r), timeoutMs);
        });
      });
    assert(report.didPass);
  });

  it('should fail if a message is never received', async function() {
    const report: NetworkTest.Report =
      await new Promise((resolve: (report: NetworkTest.Report) => void) => {
        const test = testNetwork({
          peerConnectionFactory: mockRTCPeerConnectionFactory({
            candidate: 'test',
            mockRTCDataChannelFactoryOptions: {
              doClose: true,
              doMessage: false,
              doOpen: true,
            },
          }) as any,
          timeoutMs,
        });
        test.on(NetworkTest.Events.Error, errorHandler);
        test.on(NetworkTest.Events.End, (r: NetworkTest.Report) => {
          endHandler(r);
          setTimeout(() => resolve(r), timeoutMs);
        });
      });
    assert(!report.didPass);
    assert(report.errors.length);
    assert(endHandler.calledOnce);
    assert(endHandler.args[0][0].errors[0] instanceof DiagnosticError);
  });

  it('should forward an error from the RTCPeerConnections', async function() {
    const report: NetworkTest.Report =
      await new Promise((resolve: (report: NetworkTest.Report) => void) => {
        const test = testNetwork({
          peerConnectionFactory: mockRTCPeerConnectionFactory({
            candidate: 'test',
            doThrow: {
              createOffer: true,
            },
            mockRTCDataChannelFactoryOptions: {
              doClose: true,
              doMessage: true,
              doOpen: true,
            },
          }) as any,
          timeoutMs,
        });
        test.on(NetworkTest.Events.Error, errorHandler);
        test.on(NetworkTest.Events.End, (r: NetworkTest.Report) => {
          endHandler(r);
          setTimeout(() => resolve(r), timeoutMs);
        });
      });
    assert(!report.didPass);
    assert(report.errors.length);
    assert(endHandler.calledOnce);
    assert(endHandler.args[0][0].errors[0] instanceof Error);
  });
});
