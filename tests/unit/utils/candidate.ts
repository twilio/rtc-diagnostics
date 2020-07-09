import * as assert from 'assert';
import { getRTCIceCandidateStatsReport } from '../../../lib/utils/candidate';

const withTransportPayload = require('../../payloads/rtcstatsreport-with-transport.json');
const withoutTransportPayload = require('../../payloads/rtcstatsreport-without-transport.json');
const withTransportSpec = require('../../specs/rtcicecandidates-with-transport.json');
const withoutTransportSpec = require('../../specs/rtcicecandidates-without-transport.json');

describe('ICE Candidate Stats', () => {
  const getStatsReport = (payload: any[]) => {
    return payload.reduce((map, rtcStats) => {
      map.set(rtcStats.id, rtcStats);
      return map;
    }, new Map());
  };
  it('should reject if WebRTC statistics is not supported', async () => {
    let error;
    const peerConnection: any = { getStats() { return Promise.reject('Foo error'); } };
    try {
      await getRTCIceCandidateStatsReport(peerConnection);
    } catch (ex) {
      error = ex;
    }
    assert.equal(error, 'Foo error');
  });

  it('should return ice candidates for report with transport stats', async () => {
    const statsReport = getStatsReport(withTransportPayload);
    const peerConnection: any = { getStats() { return Promise.resolve(statsReport); } };
    const rtcIceCandidates = await getRTCIceCandidateStatsReport(peerConnection);
    assert.deepEqual(rtcIceCandidates, withTransportSpec);
  });

  it('should return ice candidates for report without transport stats', async () => {
    const statsReport = getStatsReport(withoutTransportPayload);
    const peerConnection: any = { getStats() { return Promise.resolve(statsReport); } };
    const rtcIceCandidates = await getRTCIceCandidateStatsReport(peerConnection);
    assert.deepEqual(rtcIceCandidates, withoutTransportSpec);
  });
});
